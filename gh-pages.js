var ghPages = require("gh-pages")

ghPages.publish(
	'public', // path to public directory
	{
		branch: 'gh-pages',
		repo: 'https://github.com/Alexander-Holm/maze-algorithm.git',
		user: {
			name: 'Alexander-Holm', 
			email: 'alex.holm@live.com' 
		},
		dotfiles: true
	},
	() => {
		console.log('Deploy Complete!');
	}
); 