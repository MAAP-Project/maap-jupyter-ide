import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IStateDB } from '@jupyterlab/statedb';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { maapLogin, loadMaapEnvironment } from './funcs';
import { RequestResult } from './request';
import { Token } from '@lumino/coreutils';

const idMaapProfile = 'maapsec-extension:IMaapProfile';
const IMaapProfile = new Token<IMaapProfile>(idMaapProfile);

const idMaapEnvironment = 'maapsec-extension:IMaapEnvironment';

export interface IMaapProfile {
  proxyTicket: string;
  email: string;
  username: string;
}

class MaapProfile implements IMaapProfile {
  public proxyTicket: string;
  public email: string;
  public username: string;
}

const login_command = 'maapsec_login_command';
var loginWindow;
var _state;

export function activateLogin(app: JupyterFrontEnd, 
                        palette: ICommandPalette, state: IStateDB): IMaapProfile{

  _state = state;
  const maapProfile = new MaapProfile();
  var lbl = 'Login';

  loadMaapEnvironment()
  .then((env_result: RequestResult) => {
    console.log('saving maap environment');
    console.log(env_result);
    _state.save(idMaapEnvironment, env_result);
  });

  app.commands.addCommand(login_command, {
    label: lbl,
    isEnabled: () => true,
    execute: args => {
      
      state.fetch(idMaapEnvironment).then((maapEnv) => {
          let maapEnvObj = JSON.parse(JSON.stringify(maapEnv));
          var url = 'https://' + maapEnvObj.auth_server + '/cas/login?service=' + encodeURIComponent(window.location.href.split('?')[0]);
          var title = 'MAAP Login';
          const w = 800;
          const h = 750;
    
          var left = (screen.width/2)-(w/2);
          var top = (screen.height/2)-(h/2);
          
          loginWindow =  window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
    
          if (window.focus) loginWindow.focus();
          window.addEventListener('message', handleMessageDispatch);

      }).catch((error) => {
          console.error('Error retrieving MAAP environment from maapsec extension!');
          console.error(error);
      });
    }
  });

  palette.addItem({command: login_command, category: 'MAAP Profile'});
  console.log('MAAP Sec is activated');

  // Load the saved plugin state and apply it once the app
  // has finished restoring its former layout.
  Promise.all([state.fetch(idMaapProfile), app.restored])
    .then(([saved]) => { 
      console.log('saved profile');
      console.log(saved);
    });

  return maapProfile;
}

function handleMessageDispatch(ev) {
  window.removeEventListener('message', handleMessageDispatch);

  let sTicket = ev.data;
  loginWindow.close();

  maapLogin(encodeURIComponent(window.location.href.split('?')[0]), sTicket)
    .then((login_result: RequestResult) => {
      console.log(login_result);
      _state.save(idMaapProfile, login_result);
  });
}

// add MAAP Profile options to Menu dropdown
export function activateMenuOptions(app: JupyterFrontEnd, mainMenu: IMainMenu) {
  const { commands } = app;
  let maapProfileMenu = new Menu({ commands });
  maapProfileMenu.id = 'maapsec';
  maapProfileMenu.title.label = 'MAAP Login';
  [
    login_command,
  ].forEach(command => {
    maapProfileMenu.addItem({ command });
  });
  mainMenu.addMenu(maapProfileMenu, { rank: 110 });
}
