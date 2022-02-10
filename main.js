var Twit = require("twit");
var { containsProfanity } = require("@therohitdas/profanityjs");
var cron = require("node-cron");

var { configs } = require("./config");

const counters = {
  likes: 0,
  retweets: 0,
  follows: 0,
  unfollows: 0,
};

const rateLimited = {
  like: false,
  retweet: false,
};

const rateLimitTrackers = {
  rateLimitWindowStartTimeLike: 0, // store the epoch of the start of the rate limit window, updated every time the count%1000 == 0 && epoch is less than 24 hours
  rateLimitWindowStartTimeRetweet: 0, // store the epoch of the start of the rate limit window, updated every time the count%300 == 0 && epoch is less than 3 hours
};

var modes = configs.modes;

console.log("Starting bot...");

if (!configs.debugMode) {
  console.debug = () => {};
} else {
  console.debug("Debug mode enabled");
  console.debug(configs);
}

// check if all required ENV variables are set.
if (
  !configs.twitter.consumer_key ||
  !configs.twitter.consumer_secret ||
  !configs.twitter.access_token ||
  !configs.twitter.access_token_secret
) {
  console.error(
    "Please set the required ENV variables. See the README.md for more details."
  );
  process.exit(1);
} else if (
  !configs.hashtags.length &&
  !configs.accounts.length &&
  !configs.recurringTweet
) {
  console.error(
    "Please set at least one hashtag or account to follow. Or add a recurring tweet."
  );
  process.exit(1);
} else if (
  configs.recurringTweet &&
  cron.validate(configs.recurringTweetInterval) == false
) {
  console.error(
    "Please set a valid recurring tweet interval. Use CRON format. More info - https://www.npmjs.com/package/node-cron"
  );
  process.exit(1);
} else {
  // the twitter bot instance.
  var T = new Twit(configs.twitter);
}

if (configs.hashtags.length > 0) {
  const hashtagStream = T.stream("statuses/filter", {
    track: configs.hashtags,
  });
  hashtagStream.on("tweet", tweetHandler);
}

if (configs.accounts.length > 0) {
  const followStream = T.stream("statuses/filter", {
    follow: configs.accounts,
  });
  followStream.on("tweet", tweetHandler);
}

if (configs.recurringTweet) {
  cron.schedule(configs.recurringTweetInterval, () => {
    if (!isRateLimited("retweet")) {
      tweetRecurring();
    }
  });
}

// tick symbol
const tick = "\u2714";
console.log("Started bot " + tick);

// all functions
function tweetHandler(tweet) {
  tweet.text = tweet.text.toLowerCase();
  tweet.user.screen_name = tweet.user.screen_name.toLowerCase();
  tweet.user.name = tweet.user.name.toLowerCase();
  // filter tweet for banned words
  if (!configs.allowRetweets && tweet.text.includes("RT @")) {
    // debug pattern - Reason: retweet detected, Text:
    console.debug("Reason: retweet detected, Text: " + tweet.text);
    return;
  } else if (!configs.allowProfanity && containsProfanity(tweet.text, true)) {
    console.debug("Reason: profanity detected, Text: " + tweet.text);
    return;
  } else if (
    blockedTermsFilter(configs.blockedTerms, tweet) ||
    blockedUserFilter(configs.blockedUsers, tweet)
  ) {
    // debug pattern - Reason: blocked term detected, Text: {text}, User: {user}
    console.debug(
      "Reason: blocked term detected, Text: " + tweet.text,
      " User: ",
      tweet.user.screen_name
    );
    return;
  } else if (tweet.entities.hashtags.length > configs.hastagLimit) {
    // debug pattern - Reason: too many hashtags, Text: , User:
    console.debug(
      "Reason: too many hashtags, Text: " + tweet.text,
      " Hashtag Count: " + tweet.entities.hashtags.length
    );
    return;
  }

  if (modes["like"] && !isRateLimited("like")) {
    like(tweet.id_str);
  }

  if (modes["retweet"] && !isRateLimited("retweet")) {
    retweet(tweet.id_str);
  }
}

function like(id) {
  T.post(
    "favorites/create",
    { id, include_entities: false },
    function (err, response) {
      if (response.favorited) {
        console.log("Liked tweet " + tick + " " + id);
        incrementCounter("likes");
        if (rateLimitTrackers.rateLimitWindowStartTimeLike == 0) {
          rateLimitTrackers.rateLimitWindowStartTimeLike = new Date().getTime();
          console.debug(
            "Rate limit window start time for likes set to " +
              rateLimitTrackers.rateLimitWindowStartTimeLike
          );
        }
        if (counters.likes % 1000 == 0) {
          console.debug("Likes: " + counters.likes);
          pause("like");
        }
      } else if (err) {
        if (err.code == 226 || err.code == 205) {
          console.error("Twitter banned you!");
          process.exit(0);
        } else if (err.statusCode == 139) {
          console.error("Liked this tweet already!");
        } else if (err.code == 283) {
          console.error(err.message);
          console.error("Rate limit exceeded. Sleeping for remaining time...");
          pause("like");
        } else {
          console.error("Unknown error: " + JSON.stringify(err));
        }
      }
    }
  );
}

function retweet(id) {
  T.post("statuses/retweet", { id, trim_user: 1 }, async (err, response) => {
    if (err) {
      if (err.code == 226 || err.code == 205) {
        console.error("Twitter banned you!");
        process.exit(0);
      } else if (err.statusCode == 139) {
        console.error("Retweeted this tweet already!");
      } else if (err.code == 283) {
        console.error(err.message);
        console.error("Rate limit exceeded. Sleeping for remaining time...");
        pause("retweet");
      } else {
        console.error("Unknown error: " + JSON.stringify(err));
      }
    } else {
      console.log("Retweeted tweet " + tick + " " + id);
      incrementCounter("retweets");
      if (rateLimitTrackers.rateLimitWindowStartTimeRetweet == 0) {
        rateLimitTrackers.rateLimitWindowStartTimeRetweet =
          new Date().getTime();
      }
      if (counters.retweets % 300 == 0) {
        pause("retweet");
      }
    }
  });
}

function tweetRecurring() {
  T.post(
    "statuses/update",
    { status: configs.recurringTweet },
    (err, response) => {
      if (err) {
        if (err.code == 226 || err.code == 205) {
          console.error("Twitter banned you!");
          process.exit(0);
        } else if (err.code == 283) {
          console.error(err.message);
          console.error("Rate limit exceeded. Sleeping for remaining time...");
          pause("retweet");
        } else {
          console.error("Error: id - " + id + " Message: " + err.message);
        }
      } else {
        console.log("Tweeted " + tick);
      }
    }
  );
}

function incrementCounter(key) {
  counters[key]++;
}

function resetRateLimit(key) {
  const now = new Date().getTime();
  if (
    key == "like" &&
    rateLimitTrackers.rateLimitWindowStartTimeLike < now - 1000 * 60 * 60 * 24
  ) {
    rateLimitTrackers.rateLimitWindowStartTimeLike = now;
    counters.likes = 0;
  } else if (
    key == "retweet" &&
    rateLimitTrackers.rateLimitWindowStartTimeRetweet < now - 1000 * 60 * 60 * 3
  ) {
    rateLimitTrackers.rateLimitWindowStartTimeRetweet = now;
    counters.retweets = 0;
  }
}

function pause(key) {
  console.log("Stopping bot functions - " + key + "...");
  const now = new Date().getTime();
  // sleep
  var sleepTime = -1;

  if (key == "like") {
    sleepTime =
      1000 * 60 * 60 * 24 -
      (now - rateLimitTrackers.rateLimitWindowStartTimeLike);
  } else if (key == "retweet") {
    sleepTime =
      1000 * 60 * 60 * 3 -
      (now - rateLimitTrackers.rateLimitWindowStartTimeRetweet);
  }

  if (sleepTime <= 0) {
    return true;
  }

  rateLimited[key] = true;
  console.debug("Rate limit setting: " + JSON.stringify(rateLimited));
  setTimeout(() => {
    console.log("Resuming bot functions - " + key + "...");
    if (key == "like") {
      rateLimitTrackers.rateLimitWindowStartTimeLike = new Date().getTime();
    } else {
      rateLimitTrackers.rateLimitWindowStartTimeRetweet = new Date().getTime();
    }
    resetRateLimit(key);
    rateLimited[key] = false;
  }, sleepTime);
}

function blockedTermsFilter(blockedTerms, tweet) {
  for (let i = 0; i < blockedTerms.length; i++) {
    if (
      tweet.text.includes(blockedTerms[i]) ||
      tweet.user.screen_name.includes(blockedTerms[i]) ||
      tweet.user.name.includes(blockedTerms[i])
    ) {
      return true;
    }
  }
  return false;
}

function blockedUserFilter(blockedUsers, tweet) {
  for (let i = 0; i < blockedUsers.length; i++) {
    if (tweet.user.screen_name == blockedUsers[i]) {
      return true;
    }
  }
  return false;
}

function isRateLimited(key) {
  return rateLimited[key];
}

async function sleep(millis) {
  console.log("Sleeping for " + sleepTime / 1000 + " seconds...");
  return new Promise((resolve) => setTimeout(resolve, millis));
}
