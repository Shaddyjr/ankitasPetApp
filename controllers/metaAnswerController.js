module.exports = function (app, dbHandler) {
    app.route("/metaAnswers")
        .get((req,res)=>{
            dbHandler.getQuestions()
                .then(questions=>{
                    res.render("metaAnswers",{
                        "questions":questions
                    });
                })
        })
    
    app.route("/metaAnswers/:id")
        .get((req,res)=>{
            const metaAnswerId = req.params.id;
            dbHandler.findById("metaAnswers",metaAnswerId)
                .then(metaAnswer=>{
                    res.render("metaAnswer",{
                        "metaAnswer": metaAnswer
                    })
                })
        })
}