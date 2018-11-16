const express = require('express');
const router = express.Router();

const authenticationHandler = (req, res, next) => {
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('/');
  }

const admingAuthentication = (req,res,next) => {
    if(req.user && req.user.admin === 1){
        next();
    }else{
        res.redirect("/logout");
    }
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

const injectUser = (req,res,next) => {
    if(req.user){
        res.locals.user = req.user;
    }
    next();
}
module.exports = (dbHandler) => {
    // Injecting data
    router.use(errorHandler);
    router.use(injectUser);

    const indexRouter = require('./index')(dbHandler,authenticationHandler);
    router.use('/', indexRouter);

    const sheltersRouter = require('./shelters')(dbHandler, admingAuthentication);
    router.use('/shelters', sheltersRouter);

    // Authenticated after this point
    router.use(authenticationHandler);

    const metaFormRouter = require('./metaForm')(dbHandler);
    router.use('/metaForm', metaFormRouter);

    // Authenticated Admin after this point
    router.use(admingAuthentication);
    // admin
    const adminRouter = require('./admin')(dbHandler);
    router.use('/admin', adminRouter);

    return router;
}