# twitter-bot

A classic Twitter Retweet Bot - easy to deploy and configure.

## Features

- Easy configuration via environment variables
- Follow a list of **hashtags** and/or **accounts**. Recieve every tweet that matches.
- You can **like, retweet** a tweet from the accounts or hastags you are following.
- Set up 1 recurring tweet. You can tweet anything repeatedly at a defined interval. Time intervals are defined using CRON syntax.
- Uses the Twitter API v1.1

## Requirements

To use this bot, you need to create a Twitter application and get the following credentials:

    - Consumer key
    - Consumer secret
    - Access token
    - Access token secret

A tutorial to get all these - [Twitter Developer Account Tutorial](https://tweetfull.com/steps-to-create-a-developer-account-on-twitter)

Select "making a bot" whenever you are presented with such choice during the sign up flow.

Also one important thing to note -

You will be able to generate the `access token` and `access token secret` only for the account you are using to sign up for Twitter Developer Account.

To generate ACCESS TOKEN and ACCESS TOKEN SECRET for a non Twitter Developer Account, you will have to create a Twitter Login Flow and get the other account to signup using twitter.

Code to easily build twitter login flow - [REPLIT](https://replit.com/@therohitdas/twitter-login) / [GITHUB](https://github.com/therohitdas/twitter-login/)
Once authenticate it will return JSON with all the required keys.

## Deployment

I suggest using Docker with [Captain Rover](https://caprover.com/) to deploy this bot. It will be easier to manage that way. Otherwise you can also use pm2 to run it as a process.

For Docker deployments, pull the docker image and run it using the follwing command:

    sudo docker run \
        -e BOT_ALLOW_RETWEETS=true \
        -e BOT_HASHTAG=100daysofwriting \
        -e BOT_RECURRING_TWEET="What did you learn today? #100daysofwriting" \
        -e BOT_RECURRING_TWEET_INTERVAL="0 19 * * *" \
        -e BOT_CONSUMER_KEY=fsafsdfsdfsg5Vdfgofga \
        -e BOT_CONSUMER_SECRET=dfgdfgdfggdgtrhhfhgkjfdgkidfghdfighdiohgoidfhgodf \
        -e BOT_ACCESS_TOKEN=fdgdfgdfighdfoighdfogdfvnfihdfnvifodhdfoioidfhdfoh \
        -e BOT_ACCESS_TOKEN_SECRET=fdfdhfdhffbfgfghgfhfhfghfghghfghfghgfhgfh \
        --name twitter-bot twitter-bot

## Configurations ans Usage

All configurations are passed using environment variables.
If you want to pass more than one value for a configuration, you can pass it as a comma separated string. For example, if you want to pass multiple hashtags, you can pass them as `BOT_HASHTAG=hashtag1,hashtag2`. This will be parsed as a list of hashtags.

    - BOT_ALLOW_RETWEETS: Allow bot to retweet tweets. Default: false
    - BOT_HASHTAG: List of hashtags to follow. Default: none
    - BOT_ACCOUNT: List of accounts to follow. Default: none
    - BOT_BLOCKED_TERMS: List of terms to filter the tweets. Default: none
    - BOT_BLOCKED_USERS: List of users to block from tweets. Default: none
    - BOT_ALLOW_PROFANITY: Allow bot to post tweets with profanity. Default: false
    - BOT_HASHTAG_LIMIT: Limit the number of hastags that is allowed in the tweet. Default: 5
    - BOT_DEBUG_MODE: Enable debug mode. Default: false
    - BOT_MODE: Mode of the bot. accepted values - like, retweet, follow, unfollow. Default: all
    - BOT_RECURRING_TWEET: Recurring tweet to tweet. Default: none
    - BOT_RECURRING_TWEET_INTERVAL: CRON syntax for recurring tweet interval. Default: none
    - BOT_CONSUMER_KEY: Twitter consumer key. Default: none
    - BOT_CONSUMER_SECRET: Twitter consumer secret. Default: none
    - BOT_ACCESS_TOKEN: Twitter access token. Default: none
    - BOT_ACCESS_TOKEN_SECRET: Twitter access token secret. Default: none

### Usage

You can use this bot to do the following actions:

- like: Bot will like tweets from the accounts and hashtags you are following.
- retweet: Bot will retweet tweets from the accounts and hashtags you are following.
- all: Bot will do all the above.
- recurring tweet: Bot will tweet the recurring tweet at the specified interval.

You must set the `BOT_MODE` environment variable to one of the above.
Recurring tweet mode is automatically enabled if you set both `BOT_RECURRING_TWEET` and `BOT_RECURRING_TWEET_INTERVAL` to an acceptable value.

I am currently working on the `follow back your followers` feature.

### Set up a simple like and retweet bot

Set the `BOT_MODE` environment variable to `all`.
Add the hashtag you want to track in the `BOT_HASHTAG` environment variable. You can add multiple hashtags by separating them with a comma.
Add the account you want to follow in the `BOT_ACCOUNT` environment variable. You can add multiple accounts by separating them with a comma.

You can use both the `BOT_HASHTAG` and `BOT_ACCOUNT` environment variables to follow multiple accounts and hashtags. If you want to only use either of the, it is also possible - just don't set the other env var.

### How to use it only for recurring tweet?

1. Set the `BOT_MODE` environment variable to `none`.
2. Set the `BOT_RECURRING_TWEET` environment variable to the tweet you want to tweet.
3. Set the `BOT_RECURRING_TWEET_INTERVAL` environment variable to the CRON syntax for the interval.

### How to only retweet tweets from the account or hashtags you are following?

Set the mode to `retweet` and pass the `BOT_MODE` environment variable.

### How to only like tweets from the account or hashtags you are following?

Set the mode to `like` and pass the `BOT_MODE` environment variable.

### How to enable profanity in the bot

Want to allow the bot to post tweets with profanity?
Set `BOT_ALLOW_PROFANITY=true` and run the bot.

This project is a work in progress. I am working on adding more features and fixing bugs. If you have any suggestions, please let me know.
