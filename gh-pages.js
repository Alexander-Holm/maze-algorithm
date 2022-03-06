var ghPages = require('gh-pages');

ghPages.publish(
	'public', // path to public directory
	{
		branch: 'gh-pages',
		repo: 'https://github.com/Alexander-Holm/maze-algorithm.git', // Update to point to your repository
		user: {
			name: 'Alexander-Holm', // update to use your name
			email: 'alex.holm@live.com' // Update to use your email
		},
		dotfiles: true
	},
	() => {
		console.log('Deploy Complete!');
	}
);