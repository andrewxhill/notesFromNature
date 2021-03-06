Spine   = require('spine')
Subject = require('models/Subject')
Archive = require('models/Archive')
Classification = require('models/Classification')


EOL     = require('models/EOL')

class SernacTranscriptionController extends Spine.Controller
  className: "SernacTranscriptionController"

  constructor:->
    super 
    Spine.bind("finishedSernacTranscription", @saveClassification)

  startWorkflow:(subject)=>

    @currentSubject= subject
    
    archive = Archive.find(@currentSubject.archive_id)
    @render()
    @delay =>

      nfn.load "nfn/", =>

        GOD = new nfn.ui.view.GOD({
          model: new nfn.ui.model.GOD()
        })

        window.GOD = GOD

        transcriberModel = new nfn.ui.model.Herbarium()

        @transcriber = new nfn.ui.view.HerbariumTranscriber({
          model: transcriberModel
        })

        $(".btn.close").attr("href", "#/archives/#{archive.slug()}")
        
        @nextSubject()
        window.transcriber = @transcriber
        

    , 500

  saveClassification:(data)=>
   
    classification = Classification.create({subject_id: @currentSubject.id, workflow_id: @currentSubject.workflow_ids[0] } )
    for annotation in data.toJSON()
      classification.annotate annotation.step, annotation.value

    classification.save()
    @currentSubject.active=false 
    @currentSubject.save()
    classification.send()
    @nextSubject()

  nextSubject:=>
    callback = => 
      $(".photos img").animate({ marginLeft: "0" }, 500)
      @transcriber.spinner.hide()
      @transcriber.startTranscribing()

    @currentSubject= Subject.random()
    
    @transcriber.loadPhoto(@currentSubject.location.standard, callback)

  render:=>
    @html require('views/transcription/sernac')
      subject: @currentSubject


module.exports = SernacTranscriptionController
