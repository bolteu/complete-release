"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const exec = __importStar(require("@actions/exec"));
const node_fetch_1 = __importDefault(require("node-fetch"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!github.context.payload.issue) {
                throw {
                    message: "This action can only be executed from PR or Issue"
                };
            }
            let pullRequestApiUrl = github.context.payload.issue.pull_request.url;
            const githubApiToken = core.getInput('github-token');
            const githubUserName = core.getInput('github-user-name');
            const githubUserEmail = core.getInput('github-user-email');
            if (githubApiToken !== null) {
                pullRequestApiUrl = pullRequestApiUrl.replace("api.github.com", `${githubApiToken}@api.github.com`);
            }
            console.log(`Fetching PR info by url: ${pullRequestApiUrl}`);
            const pullRequest = yield node_fetch_1.default(pullRequestApiUrl).then(data => data.json());
            let pullRequestHtmlUrl = pullRequest.base.repo.html_url;
            if (githubApiToken !== null) {
                pullRequestHtmlUrl = pullRequestHtmlUrl.replace("github.com", `${githubApiToken}@github.com`);
            }
            console.log(`PR payload: \n ${JSON.stringify(pullRequest)}!`);
            const headRef = pullRequest.head.ref;
            const baseRef = pullRequest.base.ref;
            let myOutput = '';
            let myError = '';
            const options = {
                listeners: {
                    stdout: (data) => {
                        myOutput += data.toString();
                    },
                    stderr: (data) => {
                        myError += data.toString();
                    }
                }
            };
            if (githubUserName) {
                yield exec.exec('git', ['config', '--global', 'user.name', `"${githubUserName}"`]);
            }
            if (githubUserEmail) {
                yield exec.exec('git', ['config', '--global', 'user.email', `"${githubUserName}"`]);
            }
            yield exec.exec('git', ['checkout', '-B', baseRef]);
            yield exec.exec('git', ['merge', `origin/${headRef}`, '--allow-unrelated-histories', '--strategy-option', 'theirs'], options);
            yield exec.exec('git', ['push', pullRequestHtmlUrl]);
            const time = (new Date()).toTimeString();
            core.setOutput("time", time);
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
;
run();
