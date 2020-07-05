import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {IMainMenu} from '@jupyterlab/mainmenu'

import {Menu} from '@lumino/widgets'

import '../style/index.css';
import { showDialog, Dialog, MainAreaWidget, IFrame } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

namespace CommandIDs {
  export const input = "ui:input";
  
  export const open = "ui:open";
}

/**
 * Initialization data for the jupyterlab-spark extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_spark',
  autoStart: true,
  requires: [IMainMenu],
  activate: activate_custom_menu
};

export default extension;

export function activate_custom_menu(app: JupyterFrontEnd, mainMenu: IMainMenu): Promise<void> {
  console.log('JupyterLab extension jupyterlab_spark is activated!');

  let namespace = 'spark-ui'
  let counter = 0;
  
  function newWidget(url: string, text: string): MainAreaWidget {
    let content = new IFrame({sandbox: ['allow-forms', 'allow-same-origin', 'allow-scripts']});
    content.url = url;
    content.title.label = text;
    content.id = `${namespace}-${++counter}`;
    let widget = new MainAreaWidget({ content });
    return widget;
  }


  app.commands.addCommand(CommandIDs.input, {
    label: 'Application UI',
    execute: args => {
      showDialog({
        title: 'Input the Spark application id',
        body: new InputAppIdWidget(),
        buttons: [Dialog.cancelButton(), Dialog.okButton({ label : 'CREATE'})]
      }).then(result => {
        if (result.button.label === 'CREATE') {
          const appId = <string>result.value;
          return app.commands.execute(CommandIDs.open, {appId: appId});
        } else {
          return;
        }
      })
    }
  });

  app.commands.addCommand(CommandIDs.open, {
    execute: args => {
      const url = 'http://localhost:8080/app/?appId=' + args['appId'];
      let widget =  newWidget(url, 'Spark App UI');
      if (!widget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.add(widget, "main");
      }
      // Activate the widget
      app.shell.activateById(widget.id);
    }
  })

  const sparkMenu = Private.createMenu(app, 'Spark');
  sparkMenu.addItem({ command: CommandIDs.input });

  mainMenu.addMenu(sparkMenu, { rank: 70 });

  return Promise.resolve(void 0);
}

class InputAppIdWidget extends Widget {
  constructor() {
    super({node: Private.createOpenNode() });
  }

  /**
   * Get the value of the widget
   */
  getValue(): string {
    return this.inputNode.value;
  }

  /**
   * Get the input text node.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }

}

namespace Private {

  export function createMenu(app: JupyterFrontEnd, label: string): Menu {
    const {commands} = app;
    const menu = new Menu({ commands });
    menu.title.label = label;
    return menu;
  }

  export function createOpenNode(): HTMLElement {
    let body = document.createElement('div');
    let existingLabel = document.createElement('label');
    existingLabel.textContent = 'Application Id:';

    let input = document.createElement('input');
    input.value = '';
    input.placeholder = 'app-xxx';

    body.appendChild(existingLabel);
    body.appendChild(input);
    return body;
  }
}
