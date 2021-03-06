const { Task, TASKS_WORKER, TASKS_INFO, jobFunc } = require('../func/task')

const { logger, list } = require('../utils')
const clog = new logger({ head: 'wbtask' })

module.exports = app => {
  app.get("/task", (req, res)=>{
    clog.notify((req.headers['x-forwarded-for'] || req.connection.remoteAddress), `get task lists`)
    res.end(JSON.stringify(TASKS_INFO))
  })

  app.put("/task", (req, res)=>{
    clog.notify((req.headers['x-forwarded-for'] || req.connection.remoteAddress), `put task`, req.body.op)
    let data = req.body.data
    switch(req.body.op){
      case "start":
        if (TASKS_WORKER[data.tid]) {
          clog.info('delete task old data')
          if (TASKS_WORKER[data.tid].stat()) TASKS_WORKER[data.tid].stop()
          TASKS_WORKER[data.tid].delete()
        }

        TASKS_INFO[data.tid] = data.task
        TASKS_INFO[data.tid].id = data.tid
        TASKS_WORKER[data.tid] = new Task(TASKS_INFO[data.tid], jobFunc(data.task.job))
        TASKS_WORKER[data.tid].start()
        res.end('task: ' + data.task.name + ' started!')
        break
      case "stop":
        if(TASKS_WORKER[data.tid]) {
          TASKS_WORKER[data.tid].stop()
          res.end("task stopped!")
        } else {
          res.end("no such task")
        }
        break
      case "delete":
        if(TASKS_WORKER[data.tid]) {
          TASKS_WORKER[data.tid].delete()
          delete TASKS_INFO[data.tid]
        }
        res.end("task deleted!")
        break
      default:{
        res.end("task operation error")
      }
    }
  })

  app.post("/task", (req, res)=>{
    clog.notify((req.headers['x-forwarded-for'] || req.connection.remoteAddress), `save task list`)
    list.put('task.list', req.body)
    res.end("success saved!")
  })
}