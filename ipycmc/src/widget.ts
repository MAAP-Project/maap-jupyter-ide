// Copyright (c) Flynn Platt
// Distributed under the terms of the Modified BSD License.

import { DOMWidgetModel, DOMWidgetView, ISerializers } from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

import { generatePlotCommand } from './plot';

import path from 'path';
import moment from 'moment';
import CMC_Module = require('maap-common-mapping-client');
const CMC = CMC_Module.CMC;
require('maap-common-mapping-client/dist/bundle.css');
require('maap-common-mapping-client/dist/assets/mapskin/css/mapskin.min.css');

function importAll(r: any) {
    r.keys().forEach(r);
}

importAll(
    require.context(
        'file-loader?emitFile=true&outputPath=assets/cesium/Workers/&name=[name].[ext]!maap-common-mapping-client/dist/assets/cesium/Workers',
        true,
        /\.(js)/,
    ),
);

// const def_loc = [0.0, 0.0];
export class MapCMCModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: MapCMCModel.model_name,
            _model_module: MapCMCModel.model_module,
            _model_module_version: MapCMCModel.model_module_version,
            _view_name: MapCMCModel.view_name,
            _view_module: MapCMCModel.view_module,
            _view_module_version: MapCMCModel.view_module_version,
            _argv: [],
            _state: {},
            _workspace_base_url: '',
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        // Add any extra serializers here
    };

    static model_name = 'MapCMCModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
    static view_name = 'MapCMCView'; // Set to null if no view
    static view_module = MODULE_NAME; // Set to null if no view
    static view_module_version = MODULE_VERSION;
}

export class MapCMCView extends DOMWidgetView {
    appDiv: HTMLDivElement | undefined;
    cmc: any;

    _syncCMC() {
        const state = this.cmc._store.getState();
        const prevState = this.model.get('_state');
        this.model.set('_state', {
            date: moment.utc(state.map.get('date')).toISOString(),
            layers: state.map.get('layers').toJS(),
            areaSelections: state.map
                .get('areaSelections')
                .toList()
                .toJS(),
            plot: state.plot.toJS(),
        });
        this.touch();
        const currState = this.model.get('_state');

        if (
            currState.plot.commandGenCtr >= 0 &&
            currState.plot.commandGenCtr !== prevState.plot.commandGenCtr
        ) {
            this.loadPlotCommand();
        }
    }

    render() {
        this.model.on('change:_argv', this.argvUpdate, this);

        // standard HTML DOM change from JS
        const wrapperDiv = document.createElement('div');
        wrapperDiv.style.width = '100%';
        wrapperDiv.style.height = '500px';
        const appDiv = document.createElement('div');
        appDiv.style.width = '100%';
        appDiv.style.height = '100%';
        wrapperDiv.appendChild(appDiv);
        this.el.appendChild(wrapperDiv);

        this.appDiv = appDiv;
        this.displayed.then(() => this.render_cmc());
    }

    render_cmc() {
        let baseUrl = path.join(this.model.get('_workspace_base_url'), '/static/lab');
        this.cmc = new CMC({ target: this.appDiv, base_url: baseUrl });
        this._syncCMC();

        this.cmc._store.subscribe(() => {
            this._syncCMC();
        });

        this.cmc.render().then(() => {
            this.cmc.dispatch.initializeMap();
        });

        console.log(this.cmc);
    }

    argvUpdate() {
        const argv = this.model.get('_argv');
        const func = argv.splice(0, 1)[0];

        switch (func) {
            case 'loadLayerConfig':
                this.loadLayerConfig(argv);
                break;
            case 'setDate':
                this.setDate(argv);
                break;
            case 'setProjection':
                this.setProjection(argv);
                break;
            default:
                console.warn(`WARN: unknown function '${func}'`);
                break;
        }
    }

    loadLayerConfig(argv: Array<any>) {
        const [url, type, defaultOps] = argv;
        this.cmc.dispatch.loadLayerSource(
            {
                url,
                type,
            },
            defaultOps,
        );
    }

    setDate(argv: Array<any>) {
        const [dateStr, formatStr] = argv;
        const date = moment.utc(dateStr, formatStr);
        if (date.isValid()) {
            this.cmc.dispatch.setDate(date);
        }
    }

    setProjection(argv: Array<any>) {
        const [projStr] = argv;
        this.cmc.dispatch.setMapProjection(projStr);
    }

    loadPlotCommand() {
        const currState = this.model.get('_state');
        const commandStr = generatePlotCommand(currState.plot.commandInfo);

        // @ts-ignore: context doesn't exist in manager
        const callback = this.model.widget_manager.context._appendCellWithContent;
        if(callback) {
            callback(commandStr);
        }
    }
}
