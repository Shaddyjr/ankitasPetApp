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
module.exports = (app, dbHandler) => {
    // Injecting data
    app.use(errorHandler);

    const indexRouter = require('./index')(dbHandler,authenticationHandler);
    app.use('/', indexRouter);

    const sheltersRouter = require('./shelters')(dbHandler);
    app.use('/shelters', sheltersRouter);

    const metaFormRouter = require('./metaForm')(dbHandler);
    app.use('/metaForm', metaFormRouter);

    // admin
    const adminRouter = require('./admin')(dbHandler);
    app.use('/admin', adminRouter);
}