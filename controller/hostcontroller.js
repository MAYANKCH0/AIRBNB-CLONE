const Home = require("../models/home");

// Initialize default homes if none exist
const initializeDefaultHomes = async () => {
  try {
    const homes = await Home.fetchAll();
    if (homes.length === 0) {
      const defaultHomes = [
        {
          houseName: "Luxury Beach Villa",
          price: 299,
          location: "Maldives",
          rating: 4.8,
          photoUrl: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
          isDefault: true
        },
        {
          houseName: "Mountain View Cabin",
          price: 199,
          location: "Swiss Alps",
          rating: 4.7,
          photoUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1065&q=80",
          isDefault: true
        },
        {
          houseName: "Modern City Apartment",
          price: 159,
          location: "New York",
          rating: 4.6,
          photoUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
          isDefault: true
        }
      ];

      for (const home of defaultHomes) {
        const newHome = new Home(
          home.houseName,
          home.price,
          home.location,
          home.rating,
          home.photoUrl,
          home.isDefault
        );
        await newHome.save();
      }
      console.log('Default homes initialized successfully');
    }
  } catch (err) {
    console.error('Error initializing default homes:', err);
  }
};

// Initialize default homes when server starts
initializeDefaultHomes();

exports.getaddhome = (req, res, next) => {
  res.render("host/edit-home", {
    pagetitle: "Add Home",
    path: "/host/add-home",
    home: null,
    errorMessage: null
  });
};

// The reason this is not working is because it always passes `home: null` to the template,
// so the edit form never gets the actual home data to populate the fields.
// You need to fetch the home by its ID from the request params and pass it to the view.

exports.getedithome = async (req, res, next) => {
  try {
    let homeId = req.params.id || req.query.id;
    if (!homeId) {
      const match = req.originalUrl.match(/\/edit-home\/(\\d+)/);
      if (match && match[1]) {
        homeId = match[1];
      }
    }

    if (!homeId) {
      return res.status(400).render("host/edit-home", {
        pagetitle: "Edit Home",
        path: "/host/edit-home",
        home: null,
        errorMessage: "No home ID provided."
      });
    }

    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).render("host/edit-home", {
        pagetitle: "Edit Home",
        path: "/host/edit-home",
        home: null,
        errorMessage: "Home not found."
      });
    }
    res.render("host/edit-home", {
      pagetitle: "Edit Home",
      path: "/host/edit-home",
      home: home,
      errorMessage: null
    });
  } catch (err) {
    console.error('Error fetching home for edit:', err);
    res.status(500).render("host/edit-home", {
      pagetitle: "Edit Home",
      path: "/host/edit-home",
      home: null,
      errorMessage: "Error fetching home data."
    });
  }
};

exports.postaddhome = (req, res, next) => {
  console.log('=== Starting postaddhome ===');
  console.log('Request body:', req.body);
  
  try {
    const { houseName, price, location, rating, photoUrl } = req.body;
    
    if (!houseName || !price || !location || !rating || !photoUrl) {
      console.log('Missing required fields');
      return res.render("host/edit-home", {
        pagetitle: "Add Home",
        path: "/host/add-home",
        home: null,
        errorMessage: "All fields are required. Please fill in all details."
      });
    }

    const home = new Home(houseName, price, location, rating, photoUrl);
    console.log('Created home object:', home);
    
    home
      .save()
      .then(() => {
        console.log('Home saved successfully, attempting redirect...');
        req.session.successMessage = 'Home added successfully!';
        res.redirect("/host/homeadded");
      })
      .catch((err) => {
        console.error('Error in postaddhome:', err);
        res.render("host/edit-home", {
          pagetitle: "Edit Home",
          path: "/host/edit-home",
          errorMessage: "Error saving property. Please try again.",
          home: null
        });
      });
  } catch (err) {
    console.error('Error processing form data:', err);
    res.render("host/edit-home", {
      pagetitle: "Edit Home",
      path: "/host/edit-home",
      errorMessage: "Error processing form data. Please try again.",
      home: null
    });
  }
};

exports.gethosthomes = (req, res, next) => {
  const { search, sort } = req.query;
  Home.fetchAll()
    .then((homes) => {
      // Only show homes where isDefault is strictly false
      let userHomes = homes.filter(home => home.isDefault === false);
      console.log('User homes:', userHomes);
      // Search filter
      if (search) {
        const s = search.toLowerCase();
        userHomes = userHomes.filter(home =>
          home.houseName.toLowerCase().includes(s) ||
          home.location.toLowerCase().includes(s)
        );
      }
      // Sort
      if (sort === 'price_asc') userHomes.sort((a, b) => Number(a.price) - Number(b.price));
      if (sort === 'price_desc') userHomes.sort((a, b) => Number(b.price) - Number(a.price));
      if (sort === 'rating_asc') userHomes.sort((a, b) => Number(a.rating) - Number(b.rating));
      if (sort === 'rating_desc') userHomes.sort((a, b) => Number(b.rating) - Number(a.rating));
      // Map for view
      userHomes = userHomes.map(home => ({
        id: home.id,
        houseName: home.houseName,
        location: home.location,
        price: home.price,
        photoUrl: home.photoUrl,
        rating: home.rating || 0
      }));
      const successMessage = req.session.successMessage || null;
      req.session.successMessage = null;
      res.render("host/host-home-list", {
        registeredhomes: userHomes,
        pagetitle: "Host Homes",
        path: "/host/host-home-list",
        successMessage,
        search,
        sort
      });
    })
    .catch(err => {
      console.error('Error fetching homes:', err);
      res.render("host/host-home-list", {
        registeredhomes: [],
        pagetitle: "Host Homes",
        path: "/host/host-home-list",
        successMessage: null,
        search,
        sort
      });
    });
};

exports.gethomeadded = (req, res, next) => {
  console.log('=== Rendering homeadded page ===');
  try {
    res.render("host/homeadded", {
      pagetitle: "Home Added Successfully",
      path: "/host/homeadded"
    });
  } catch (err) {
    console.error('Error rendering homeadded page:', err);
    res.status(500).render('error', {
      pagetitle: 'Error',
      message: 'Error displaying success page'
    });
  }
};

exports.get404 = (_, res, next) => {
  res.status(404).render("404", { pagetitle: "Page Not Found" });
};

exports.postedithome = (req, res, next) => {
  const homeId = req.params.id;
  const { houseName, price, location, rating, photoUrl } = req.body;

  if (!houseName || !price || !location || !rating || !photoUrl) {
    return res.render("host/edit-home", {
      home: { id: homeId, houseName, price, location, rating, photoUrl },
      pagetitle: "Edit Home",
      path: "/host/edit-home",
      edit: true,
      errorMessage: "All fields are required. Please fill in all details."
    });
  }

  Home.fetchAll().then(homes => {
    const idx = homes.findIndex(h => h.id === Number(homeId));
    if (idx === -1) {
      return res.status(404).render("host/edit-home", {
        home: null,
        pagetitle: "Edit Home",
        path: "/host/edit-home",
        edit: true,
        errorMessage: "Property not found."
      });
    }
    // Update the home details
    homes[idx] = {
      ...homes[idx],
      houseName,
      price,
      location,
      rating,
      photoUrl
    };
    // Save updated homes array
    const fs = require('fs');
    const path = require('path');
    const rootDir = require('../utils/pathUtil');
    const homesPath = path.join(rootDir, 'data', 'homes.json');
    fs.writeFileSync(homesPath, JSON.stringify({ homes: homes }, null, 2));
    req.session.successMessage = 'Home updated successfully!';
    res.redirect('/host/host-home-list');
  }).catch(err => {
    console.error('Error updating home:', err);
    res.render("host/edit-home", {
      home: { id: homeId, houseName, price, location, rating, photoUrl },
      pagetitle: "Edit Home",
      path: "/host/edit-home",
      edit: true,
      errorMessage: "Error updating property. Please try again."
    });
  });
};

exports.postdeletehome = (req, res, next) => {
  const homeId = req.params.id;
  Home.fetchAll().then(homes => {
    const updatedHomes = homes.filter(h => h.id !== Number(homeId));
    const fs = require('fs');
    const path = require('path');
    const rootDir = require('../utils/pathUtil');
    const homesPath = path.join(rootDir, 'data', 'homes.json');
    fs.writeFileSync(homesPath, JSON.stringify({ homes: updatedHomes }, null, 2));
    req.session.successMessage = 'Home deleted successfully!';
    res.redirect('/host/host-home-list');
  }).catch(err => {
    console.error('Error deleting home:', err);
    res.status(500).render('host/host-home-list', {
      registeredhomes: [],
      pagetitle: 'Host Homes',
      path: '/host/host-home-list',
      errorMessage: 'Error deleting property. Please try again.'
    });
  });
};

