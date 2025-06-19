const Home = require('../models/home');
const User = require('../models/user');
const mongoose = require('mongoose');

// ... existing code ...

exports.getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.render('store/favourites', {
            title: 'My Favorites',
            user: req.user,
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).send('Error fetching favorites');
    }
};

exports.addToFavorites = async (req, res) => {
    try {
        const homeId = req.body.homeId;
        
        if (!homeId) {
            return res.status(400).json({ message: 'Home ID is required' });
        }

        // Find the home
        const home = await Home.findOne({ where: { id: homeId } });
        if (!home) {
            return res.status(404).json({ message: 'Home not found' });
        }

        // Add to favorites
        await User.update(
            { id: req.user.id },
            { $push: { favorites: homeId } }
        );

        // Redirect to the home detail page
        res.redirect(`/store/homes/${homeId}`);
    } catch (error) {
        console.error('Error in addToFavorites:', error);
        res.status(500).json({ message: 'Error adding to favorites' });
    }
};



 