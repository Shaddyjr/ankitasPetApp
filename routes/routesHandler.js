const authenticationHandler = (req, res, next) => {
    if (req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
  }

module.exports = (app, dbHandler) => {

    const indexRouter = require('./index')(dbHandler,authenticationHandler);
    app.use('/', indexRouter);

    // protected
    app.use(authenticationHandler);

    const sheltersRouter = require('./shelters')(dbHandler);
    app.use('/shelters', sheltersRouter);

    const userRouter = require('./user')(dbHandler);
    app.use('/user', userRouter);

    // admin
    const adminRouter = require('./admin')(dbHandler);
    app.use('/admin', adminRouter);

}