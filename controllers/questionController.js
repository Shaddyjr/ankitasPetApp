
// SHOULD INCLUDE PARAMS VALIDATION
module.exports = function (app, dbHandler) {
    const errorHandler = (err,response) => {
        response.render("error",{error:err});
    }

    app.route("/question/:id")
    .get((req,res)=>{
        const questionId = req.params.id;
        dbHandler.findById("questionsWithShelter",questionId)
            .then(question=>{
                const metaAnswerId = question.metaAnswerId;
                if(metaAnswerId){
                    dbHandler.findById("metaAnswer",metaAnswerId)
                        .then(metaAnswer=>{
                            res.render("question",{
                                "data":{
                                    "question":question,
                                    "metaAnswer":metaAnswer
                                }
                            })
                        })
                }else{
                    res.render("question",{
                        "data":{
                            "question":question
                        }
                    })
                }
            })
            .catch(err=>errorHandler(err,res))
    })
    .post((req,res)=>{
        const questionId = req.params.id;
        dbHandler.updateData("questionsMetaAnswerId",questionId)
            .then(question=>{

            })
            .catch(err=>errorHandler(err,res))
        res.redirect('back');
    })
}