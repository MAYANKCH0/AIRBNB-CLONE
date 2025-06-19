const Home = require("../models/home");
const Booking = require("../models/booking");

// Remove the clearAll call as it's causing data loss
// Home.clearAll().catch(err => console.error('Error clearing data:', err));

exports.getproperties = (req, res, next) => {
  const { search = '', sort = '' } = req.query;
  Home.fetchAll().then(homes => {
    let filtered = homes;
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(home =>
        home.houseName.toLowerCase().includes(s) ||
        home.location.toLowerCase().includes(s)
      );
    }
    // Sort
    if (sort === 'price_asc') filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'rating_asc') filtered.sort((a, b) => Number(a.rating) - Number(b.rating));
    if (sort === 'rating_desc') filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    res.render('store/properties', {
      properties: filtered,
      pagetitle: 'Properties',
      path: '/homes/properties',
      search,
      sort
    });
  });
};

exports.gethomes = (req, res, next) => {
  const { search = '', sort = '' } = req.query;
  Home.fetchAll().then(homes => {
    let filtered = homes;
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(home =>
        home.houseName.toLowerCase().includes(s) ||
        home.location.toLowerCase().includes(s)
      );
    }
    // Sort
    if (sort === 'price_asc') filtered.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price_desc') filtered.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'rating_asc') filtered.sort((a, b) => Number(a.rating) - Number(b.rating));
    if (sort === 'rating_desc') filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
    res.render('store/home-list', {
      homes: filtered,
      pagetitle: 'Home',
      path: '/',
      search: search || '',
      sort: sort || ''
    });
  });
};

exports.getBookings = (req, res, next) => {
  Booking.fetchAll().then(async bookings => {
    // Attach home details to each booking
    const homes = await Home.fetchAll();
    const bookingsWithHome = bookings.map(b => {
      const home = homes.find(h => String(h.id) === String(b.homeId));
      return { ...b, home };
    });
    res.render("store/bookings", {
      bookings: bookingsWithHome,
      pagetitle: "Bookings",
      path: "/store/bookings"
    });
  }).catch(err => {
    console.error('Error fetching bookings:', err);
    res.render("store/bookings", {
      bookings: [],
      pagetitle: "Bookings",
      path: "/store/bookings"
    });
  });
};

exports.getfavourites = (req, res, next) => {
  Home.fetchAll()
    .then((homes) => {
      res.render("store/favourite", {
        registeredhomes: homes,
        pagetitle: "Favourites",
        path: "/store/favourite"
      });
    })
    .catch(err => {
      console.error('Error fetching homes:', err);
      res.render("store/favourite", {
        registeredhomes: [],
        pagetitle: "Favourites",
        path: "/store/favourite"
      });
    });
};

  exports.postaddtofavourite = async (req, res) => {
    try {
      const homeId = req.body.homeId;
      const userId = req.user.id;
      
      await Home.addToFavourites(homeId, userId);
      
      const homes = await Home.fetchAll();
      res.render("store/favourite", {
        registeredhomes: homes,
        pagetitle: "Favourites",
        path: "/store/favourite",
        successMessage: "Property added to favourites successfully"
      });
      Favourite.addToFavourite(homeId,userId);
    } catch (err) {
      console.error('Error adding to favourites:', err);
      const homes = await Home.fetchAll();
      res.render("store/favourite", {
        registeredhomes: homes,
        pagetitle: "Favourites", 
        path: "/store/favourite",
        errorMessage: "Failed to add property to favourites"
      });
    }
  };

exports.getHomeById = (req, res, next) => {
  const homeId = parseInt(req.params.id);
  console.log('Fetching home with ID:', homeId);
  
  Home.findById(homeId)
    .then(home => {
      if (!home) {
        console.log('No home found with ID:', homeId);
        return res.status(404).render("404", { 
          pagetitle: "Property Not Found",
          path: "/404"
        });
      }
      console.log('Found home:', home);
      res.render("store/home-detail", { 
        home: home,
        pagetitle: home.houseName,
        path: "/store/home-detail"
      });
    })
    .catch(err => {
      console.error('Error fetching home:', err);
      res.status(500).render("error", { 
        pagetitle: "Error",
        path: "/error"
      });
    });
};

exports.get404 = (_, res, next) => {
  res.status(404).render("404", { 
    pagetitle: "Page Not Found",
    path: "/404"
  });
};

exports.getReserveForm = (req, res, next) => {
  const homeId = req.params.id;
  Home.findById(homeId).then(home => {
    if (!home) {
      return res.status(404).render('404', { pagetitle: 'Not Found', path: '/404' });
    }
    res.render('store/reserve', {
      home,
      pagetitle: 'Reserve Home',
      path: `/homes/reserve/${homeId}`
    });
  });
};

exports.postReserveBooking = (req, res, next) => {
  const { name, email, date, guests } = req.body;
  const homeId = req.params.id;
  Home.findById(homeId).then(home => {
    if (!home) {
      return res.status(404).render('404', { pagetitle: 'Not Found', path: '/404' });
    }
    // Save booking
    const booking = new Booking(homeId, name, email, date, guests);
    booking.save().then(() => {
      res.render('store/bookings', {
        home,
        name,
        email,
        date,
        guests,
        pagetitle: 'Booking Confirmed',
        path: '/homes/bookings',
        justConfirmed: true
      });
    }).catch(err => {
      console.error('Error saving booking:', err);
      res.status(500).render('error', {
        pagetitle: 'Error',
        path: '/error',
        message: 'Error saving booking.'
      });
    });
  });
};

exports.deleteBooking = (req, res, next) => {
  const id = req.params.id;
  const Booking = require('../models/booking');
  Booking.deleteById(id).then(() => {
    res.redirect('/store/bookings');
  }).catch(err => {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  });
};

process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});
