const dotenv = require("dotenv");
dotenv.config();

var allowRetweets = process.env.BOT_ALLOW_RETWEETS == "true" ? true : false;

var hashtags = process.env.BOT_HASHTAG
  ? process.env.BOT_HASHTAG.split(",").map((tag) => "#" + tag.trim())
  : [];
var accounts = process.env.BOT_ACCOUNTS
  ? process.env.BOT_ACCOUNTS.split(",")
  : [];
var blockedTerms = process.env.BOT_BLOCKED_TERMS
  ? process.env.BOT_BLOCKED_TERMS.split(",")
  : [];
var blockedUsers = process.env.BOT_BLOCKED_USERS
  ? process.env.BOT_BLOCKED_USERS.split(",")
  : [];
var allowProfanity = process.env.BOT_ALLOW_PROFANITY == "true" ? true : false;
var mode = process.env.BOT_MODE ? process.env.BOT_MODE.split(",") : ["all"]; // values - like, retweet, follow, unfollow, none

var recurringTweet = process.env.BOT_RECURRING_TWEET; // text
var recurringTweetInterval = process.env.BOT_RECURRING_TWEET_INTERVAL; // cron style

var modes = {
  like: false,
  retweet: false,
  follow: false,
  unfollow: false,
};

if (mode[0] == "all") {
  modes = {
    like: true,
    retweet: true,
    follow: true,
    unfollow: true,
  };
} else {
  mode.forEach((mode) => {
    modes[mode] = true;
  });
}

blockedTerms.forEach((term) => term.toLowerCase());
blockedUsers.forEach((user) => user.toLowerCase());

exports.configs = {
  twitter: {
    consumer_key: process.env.BOT_CONSUMER_KEY,
    consumer_secret: process.env.BOT_CONSUMER_SECRET,
    access_token: process.env.BOT_ACCESS_TOKEN,
    access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  },
  modes: modes,
  hashtags: hashtags,
  accounts: accounts,
  blockedTerms: blockedTerms,
  blockedUsers: blockedUsers,
  allowProfanity: allowProfanity,
  allowRetweets: allowRetweets,
  recurringTweet: recurringTweet,
  recurringTweetInterval: recurringTweetInterval,
};
