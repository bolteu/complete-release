import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import fetch from 'node-fetch';

const escapeShell = function(command:string) {
  return command.replace(/(["\s'#$`\\])/g,'\\$1');
};

async function run() {
  try {
    if (!github.context.payload.issue) {
      throw {
        message: "This action can only be executed from PR or Issue"
      }
    } 
    let pullRequestApiUrl:string = github.context.payload.issue.pull_request.url;
    const githubApiToken:string = core.getInput('github-token');
    const githubUserName:string = core.getInput('github-user-name');
    const githubUserEmail:string = core.getInput('github-user-email');
    const defaultBranch:string = core.getInput('github-default-branch');
    let tag:string = core.getInput('tag');
    const shouldTagBaseBranch:string = core.getInput('should-tag-base-branch');

    if (githubApiToken !== null) {
      pullRequestApiUrl = pullRequestApiUrl.replace("api.github.com", `${githubApiToken}@api.github.com`);
    }

    const pullRequest = await fetch(pullRequestApiUrl).then(data => data.json())

    let pullRequestHtmlUrl:string = pullRequest.base.repo.html_url;

    if (githubApiToken !== null) {
      pullRequestHtmlUrl = pullRequestHtmlUrl.replace("github.com", `${githubApiToken}@github.com`);
    }

    const headRef:string = pullRequest.head.ref;
    const baseRef:string = pullRequest.base.ref;

    if (githubUserName) {
      await exec.exec(`git config --global user.name "${githubUserName}"`);
    }

    if (githubUserEmail) {
      await exec.exec(`git config --global user.email "${githubUserEmail}"`);
    }

    await exec.exec(`git fetch ${pullRequestHtmlUrl} ${headRef} ${baseRef} ${defaultBranch}`);
    
    await exec.exec(`git checkout ${baseRef}`);

    console.log(`\n\n Merging ${headRef} into ${baseRef}`);

    await exec.exec(`git merge origin/${headRef} --allow-unrelated-histories`);

    await exec.exec(`git push ${pullRequestHtmlUrl}`);

    if (shouldTagBaseBranch) {
      if (!tag) {
        let myOutput = '';
        let myError = '';
    
        const options = {
          listeners: {
            stdout: (data: Buffer) => {
              myOutput += data.toString();
            },
            stderr: (data: Buffer) => {
              myError += data.toString();
            }
          }
        }

        await exec.exec("jq", ["-r", ".version", "package.json"], options);
        tag = `v${myOutput.trim()}`;
        myError && console.warn(myError)
      }
      console.log(`tag: ${tag}`);
      await exec.exec(`git tag ${tag}`);
      await exec.exec(`git push ${pullRequestHtmlUrl} ${tag}`);
    }

    console.log(`\n\n Merging ${headRef} into ${defaultBranch}`);

    await exec.exec(`git checkout ${defaultBranch}`);

    await exec.exec(`git merge origin/${defaultBranch} --allow-unrelated-histories`);

    await exec.exec(`git push ${pullRequestHtmlUrl}`);

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();