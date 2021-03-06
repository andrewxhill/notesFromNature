Spine = require('spine')
Archive = require('models/Archive')
API = require('zooniverse/lib/api')
BaseSubject = require('zooniverse/lib/models/subject')

class Subject extends BaseSubject
  @configure 'Subject','location', 'metadata', 'active', 'workflow_ids'
  @belongsTo 'archive', Archive
  
  constructor:->
    super
    @active= true


  @next_subject:=>
    @purge()
    API.get "/subjects", (data)=>
      Subject.create(data)
      Subject.trigger("gotNext")

  @active:=>
    @select (s)=>
      s.active
      
  @activeCount:=>
    @active().length

  @current:=>
    Subject.first()

  @getNextForCollection:(collection_id, number=2)=>
    _(number).times =>
      API.get "/projects/notes_from_nature/groups/#{collection_id}/subjects?limit=#{number}", (data)=> 
        Subject.create(data)


  @purge:=>
    for subject in Subject.all()
      subject.destroy()

  @random:=>
    @active()[Math.floor(Math.random()*@count())]

module.exports = Subject