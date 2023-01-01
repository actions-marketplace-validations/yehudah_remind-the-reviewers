const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
    const hashTag = '#remind_the_reviewers';
    const token = core.getInput('github-token', { required: false }) || process.env.GITHUB_TOKEN;
    let interval = core.getInput('interval', { required: false });

    if (!token) {
        throw new Error('No GITHUB_TOKEN found');
    }
    
    const octokit = github.getOctokit(token);
    const context = github.context;
    const prs = await octokit.request(`GET /repos/${context.repo.owner}/${context.repo.repo}/pulls?state=open`, {
        owner: context.repo.owner,
        repo: context.repo.repo,
    });

    if (prs.status !== 200) {
        throw new Error(`Bad HTTP code while fetching pull requests: ${prs.status}`);
    }
    
    prs.data.forEach(async data => {
        const comments = await octokit.request(`GET /repos/${context.repo.owner}/${context.repo.repo}/issues/${data.number}/comments`, {
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: data.number
        });

        let lastReminder = data.created_at;
        let sincePhrase = 'this PR was created';
        if (comments.status === 200) {
            if (comments.data && comments.data.length) {
                comments.data.reverse();
            }

            for (const comment of comments.data) {  
                if (comment.body.includes(hashTag)) {
                    lastReminder = comment.created_at;
                    sincePhrase = 'the last reminder';
                    break;
                }
            }
        }

        const prInterval = new Date().getTime() - new Date(lastReminder).getTime();
        const intervalInMS = interval * 60 * 60 * 1000;
        
        if (prInterval >= intervalInMS && !data.draft) {
            const reviewers = data.requested_reviewers.map(el => {
                return `@${el.login}`;
            });

            interval = parseInt(prInterval / 1000 / 60 / 60);
            const body =  `Hi ${reviewers.join(', ')}, ${interval}h passed since {sincePhrase}, please review it. ${hashTag}`;

            const response = await octokit.request(`POST /repos/${context.repo.owner}/${context.repo.repo}/issues/${data.number}/comments`, {
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: data.number,
                body: body.replace('{sincePhrase}', sincePhrase)
            });
            
            if (response.status !== 201) {
                throw new Error(`Bad HTTP code while trying to message the reviewers: ${response.status}`);
            }

            core.setOutput('time', new Date().toTimeString());
        }
    });
}

main().catch((err) => core.setFailed(err.message));