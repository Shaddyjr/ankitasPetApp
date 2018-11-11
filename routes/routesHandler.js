const express = require('express');
const router = express.Router();

const authenticationHandler = (req, res, next) => {
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
  }

/**
 * Properly handles errors sent via session.
 */
const errorHandler = (req,res,next) => {
    if(req.session.msg){
        res.locals.msg = req.session.msg;
        req.session.msg = null;
    }
    next();
}
module.exports = (dbHandler) => {
    // Injecting data
    router.use(errorHandler);

    const indexRouter = require('./index')(dbHandler,authenticationHandler);
    router.use('/', indexRouter);

    const sheltersRouter = require('./shelters')(dbHandler);
    router.use('/shelters', sheltersRouter);

    // Authenticated after this point
    router.use(authenticationHandler);

    const metaFormRouter = require('./metaForm')(dbHandler);
    router.use('/metaForm', metaFormRouter);

    // admin
    const adminRouter = require('./admin')(dbHandler);
    router.use('/admin', adminRouter);

    return router;
}