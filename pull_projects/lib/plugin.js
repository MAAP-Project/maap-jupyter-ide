module.exports = [{
    id: 'pull_projects',
    autoStart: true,
    activate: function(app) {
      console.log('JupyterLab extension pull_projects is activated!');
      console.log(app.commands);
    }
}];
