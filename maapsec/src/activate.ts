import { JupyterFrontEnd } from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { IStateDB } from '@jupyterlab/statedb';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { Menu } from '@lumino/widgets';
import { maapLogin } from './funcs';
import { RequestResult } from './request';
import { Token } from '@lumino/coreutils';

const id = 'maapsec-extension:IMaapProfile';

const IMaapProfile = new Token<IMaapProfile>(id);

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

  app.commands.addCommand(login_command, {
    label: lbl,
    isEnabled: () => true,
    execute: args => {

      var url = 'https://auth.nasa.maap.xyz/cas/login?service=' + encodeURIComponent(window.location.href.split('?')[0]);
      var title = 'MAAP Login';
      const w = 800;
      const h = 750;

      var left = (screen.width/2)-(w/2);
      var top = (screen.height/2)-(h/2);
      
      loginWindow =  window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);

      if (window.focus) loginWindow.focus();
      window.addEventListener('message', handleMessageDispatch);
    }
  });

  palette.addItem({command: login_command, category: 'MAAP Profile'});
  console.log('MAAP Sec is activated');

  // Load the saved plugin state and apply it once the app
  // has finished restoring its former layout.
  Promise.all([state.fetch(id), app.restored])
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
      _state.save(id, login_result);
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
