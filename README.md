# remind-the-reviewers

This action will remind the reviewers about unreviewed PR'S every specified interval. It will do it by "extracting" the reviewer's info from the PR and "mentioning" them by message.

By default, the `interval` is set to 24h but you can pass any input you want like in this example.

**Note**:
If you are not using my example this part is a must in your workflow, without it the action will not run, don't use input that is less than ten.
```yaml
on:
schedule:
    - cron: "*/10 * * * *"
```

## Usage

```yaml
name: Check if reviewd

on:
  schedule:
    - cron: "*/10 * * * *"

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: yehudah/remind-the-reviewers@v1.0.0
        with:
          # Remind every 1 hour
          interval: 1
```

**Known Limitations**:
* PR's count - I am fetching Github default (30). if you need more than that, you probably need to replace your current reviewers :-)
* Commnets count - For the current time I write this lines, I didn't find a proper way to keep track on the remind time interval so I use comments for that. if you have a PR with more than 30 comments (GitHub default) before starting to use this action, the "reminding" may not work properly.