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
    const sheltersRouter = require('./shelters')(dbHandler);
    app.use('/shelters', authenticationHandler, sheltersRouter);

    const userRouter = require('./user')(dbHandler);
    app.use('/user', authenticationHandler, userRouter);

}