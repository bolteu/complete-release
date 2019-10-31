import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import fetch from 'node-fetch';

const gitExec = (...gitOptionArray:string[]) => exec.exec('git', [...gitOptionArray]);

async function run() {
  try {
    if (!github.context.payload.issue) {
      throw {
        message: "This action can only be executed from PR or Issue"
      }
    } 
    let pullRequestApiUrl:string = github.context.payload.issue.pull_request.url;
    const githubApiToken:string = core.getInput('github-token');
    const shouldShowPrInfo:string = core.getInput('should-show-PR-response-data');
    const githubUserName:string = core.getInput('github-user-name');
    const githubUserEmail:string = core.getInput('github-user-email');
    let tag:string = core.getInput('tag');
    const shouldTagBaseBranch:string = core.getInput('should-tag-base-branch');

    if (githubApiToken !== null) {
      pullRequestApiUrl = pullRequestApiUrl.replace("api.github.com", `${githubApiToken}@api.github.com`);
    }

    shouldShowPrInfo && console.log(`Fetching PR info by url: ${pullRequestApiUrl}`);
    const pullRequest = await fetch(pullRequestApiUrl).then(data => data.json())

    let pullRequestHtmlUrl:string = pullRequest.base.repo.html_url;

    if (githubApiToken !== null) {
      pullRequestHtmlUrl = pullRequestHtmlUrl.replace("github.com", `${githubApiToken}@github.com`);
    }

    shouldShowPrInfo && console.log(`PR payload: \n ${JSON.stringify(pullRequest)}!`);

    const headRef:string = pullRequest.head.ref;
    const baseRef:string = pullRequest.base.ref;

    if (githubUserName) {
      await gitExec('config', '--global', 'user.name', `"${githubUserName}"`);
    }

    if (githubUserEmail) {
      await gitExec('config', '--global', 'user.email', `"${githubUserName}"`);
    }
    
    await gitExec('checkout', baseRef);
    await gitExec('merge', `origin/${headRef}`, '--allow-unrelated-histories', '--strategy-option', 'theirs');

    await gitExec('push', pullRequestHtmlUrl);

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
      await gitExec('tag', tag);
      await gitExec('push', pullRequestHtmlUrl, tag);
    }


    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();