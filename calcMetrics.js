const axios = require("axios");

const getPullRequestsData = (milestone, githubToken) => axios({
    url: 'https://api.github.com/graphql',
    method: 'post',
    headers: {
      'Authorization': `Bearer ${githubToken}`
    },
    data: {
      query: `
query {
  repository(owner:"LiskHQ", name:"lisk-hub") {
    milestone(number:${milestone}) {
        pullRequests(first:100) {
            edges {
                node {
                   title
                   number
                   additions
                   deletions
                   comments(first: 50) {
                    edges {
                        node {
                            bodyText
                        }
                    }
                    
                   }
                    reviews(first: 50) {
                        edges {
                         node {
                            bodyText
                        }   
                        }
                    }
                    reviewThreads(first: 50) {
                        edges {
                         node {
                            comments(first: 50) {
                                edges {
                                    node {
                                        bodyText
                                    }
                                }
                            }
                        }   
                        }
                    }
                }
            }
        }
    }
  }
}
`
    }
  }).then(result => {
    const columns = [
      { key: 'Design', emoji: '🎨' },
      { key: 'Functional', emoji: '🐛' },
      { key: 'Requirement', emoji: '📚'},
      { key: 'Coding', emoji: '💅'},
    ];
    console.log(`      ${columns.map(({key}) => key).join(' ')} Size       Title`);
    const pullRequests = result.data.data.repository.milestone.pullRequests.edges;
    pullRequests.map(pr => {
      const comments = pr.node.comments.edges;
      const reviews = pr.node.reviews.edges;
      const reviewThreads = pr.node.reviewThreads.edges;
      const reviewComments = reviewThreads.reduce((acc, thread) => [...acc, ...thread.node.comments.edges], []);

      const prCalc = [comments, reviews, reviewComments].reduce((acc, commentsArray) => {
          columns.map(({key, emoji}) => {
            acc[key] += calculateNumberOf(commentsArray, emoji);
          });
          return acc;
      }, columns.reduce((accumulator, { key }) => ({ ...accumulator, [key]: 0}), {}));
      const columnsDataPrint = columns.map(({key}) => `${prCalc[key]}`.padEnd(key.length)).join(' ');
      const prSize = `+${pr.node.additions}/-${pr.node.deletions}`.padEnd(10);
      console.log(`${pr.node.number}  ${columnsDataPrint} ${prSize} ${pr.node.title}`);
    });
  }, error => {
    console.log(error);
});

const calculateNumberOf = (commentsArray, emoji) => commentsArray.reduce((acc, comment) => acc + comment.node.bodyText.split(emoji).length - 1, 0);

const milestoneId = process.argv[2];
const githubToken = process.argv[3];

if (milestoneId && githubToken) {
  getPullRequestsData(milestoneId, githubToken)
} else throw new Error('You must specify two arguments: milestone ID and your Github token');

