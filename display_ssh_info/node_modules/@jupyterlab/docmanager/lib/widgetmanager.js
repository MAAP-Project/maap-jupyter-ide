"use strict";
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
Object.defineProperty(exports, "__esModule", { value: true });
const algorithm_1 = require("@phosphor/algorithm");
const disposable_1 = require("@phosphor/disposable");
const messaging_1 = require("@phosphor/messaging");
const properties_1 = require("@phosphor/properties");
const signaling_1 = require("@phosphor/signaling");
const coreutils_1 = require("@jupyterlab/coreutils");
const apputils_1 = require("@jupyterlab/apputils");
/**
 * The class name added to document widgets.
 */
const DOCUMENT_CLASS = 'jp-Document';
/**
 * A class that maintains the lifecycle of file-backed widgets.
 */
class DocumentWidgetManager {
    /**
     * Construct a new document widget manager.
     */
    constructor(options) {
        this._activateRequested = new signaling_1.Signal(this);
        this._isDisposed = false;
        this._registry = options.registry;
    }
    /**
     * A signal emitted when one of the documents is activated.
     */
    get activateRequested() {
        return this._activateRequested;
    }
    /**
     * Test whether the document widget manager is disposed.
     */
    get isDisposed() {
        return this._isDisposed;
    }
    /**
     * Dispose of the resources used by the widget manager.
     */
    dispose() {
        if (this.isDisposed) {
            return;
        }
        this._isDisposed = true;
        signaling_1.Signal.disconnectReceiver(this);
    }
    /**
     * Create a widget for a document and handle its lifecycle.
     *
     * @param factory - The widget factory.
     *
     * @param context - The document context object.
     *
     * @returns A widget created by the factory.
     *
     * @throws If the factory is not registered.
     */
    createWidget(factory, context) {
        let widget = factory.createNew(context);
        Private.factoryProperty.set(widget, factory);
        // Handle widget extensions.
        let disposables = new disposable_1.DisposableSet();
        algorithm_1.each(this._registry.widgetExtensions(factory.name), extender => {
            disposables.add(extender.createNew(widget, context));
        });
        Private.disposablesProperty.set(widget, disposables);
        widget.disposed.connect(this._onWidgetDisposed, this);
        this.adoptWidget(context, widget);
        context.fileChanged.connect(this._onFileChanged, this);
        context.pathChanged.connect(this._onPathChanged, this);
        context.ready.then(() => {
            this.setCaption(widget);
        });
        return widget;
    }
    /**
     * Install the message hook for the widget and add to list
     * of known widgets.
     *
     * @param context - The document context object.
     *
     * @param widget - The widget to adopt.
     */
    adoptWidget(context, widget) {
        let widgets = Private.widgetsProperty.get(context);
        widgets.push(widget);
        messaging_1.MessageLoop.installMessageHook(widget, this);
        widget.addClass(DOCUMENT_CLASS);
        widget.title.closable = true;
        widget.disposed.connect(this._widgetDisposed, this);
        Private.contextProperty.set(widget, context);
    }
    /**
     * See if a widget already exists for the given context and widget name.
     *
     * @param context - The document context object.
     *
     * @returns The found widget, or `undefined`.
     *
     * #### Notes
     * This can be used to use an existing widget instead of opening
     * a new widget.
     */
    findWidget(context, widgetName) {
        let widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return undefined;
        }
        return algorithm_1.find(widgets, widget => {
            let factory = Private.factoryProperty.get(widget);
            if (!factory) {
                return false;
            }
            return factory.name === widgetName;
        });
    }
    /**
     * Get the document context for a widget.
     *
     * @param widget - The widget of interest.
     *
     * @returns The context associated with the widget, or `undefined`.
     */
    contextForWidget(widget) {
        return Private.contextProperty.get(widget);
    }
    /**
     * Clone a widget.
     *
     * @param widget - The source widget.
     *
     * @returns A new widget or `undefined`.
     *
     * #### Notes
     *  Uses the same widget factory and context as the source, or throws
     *  if the source widget is not managed by this manager.
     */
    cloneWidget(widget) {
        let context = Private.contextProperty.get(widget);
        if (!context) {
            return undefined;
        }
        let factory = Private.factoryProperty.get(widget);
        if (!factory) {
            return undefined;
        }
        let newWidget = this.createWidget(factory, context);
        this.adoptWidget(context, newWidget);
        return newWidget;
    }
    /**
     * Close the widgets associated with a given context.
     *
     * @param context - The document context object.
     */
    closeWidgets(context) {
        let widgets = Private.widgetsProperty.get(context);
        return Promise.all(algorithm_1.toArray(algorithm_1.map(widgets, widget => this.onClose(widget)))).then(() => undefined);
    }
    /**
     * Dispose of the widgets associated with a given context
     * regardless of the widget's dirty state.
     *
     * @param context - The document context object.
     */
    deleteWidgets(context) {
        let widgets = Private.widgetsProperty.get(context);
        return Promise.all(algorithm_1.toArray(algorithm_1.map(widgets, widget => this.onDelete(widget)))).then(() => undefined);
    }
    /**
     * Filter a message sent to a message handler.
     *
     * @param handler - The target handler of the message.
     *
     * @param msg - The message dispatched to the handler.
     *
     * @returns `false` if the message should be filtered, of `true`
     *   if the message should be dispatched to the handler as normal.
     */
    messageHook(handler, msg) {
        switch (msg.type) {
            case 'close-request':
                this.onClose(handler);
                return false;
            case 'activate-request':
                let context = this.contextForWidget(handler);
                if (context) {
                    this._activateRequested.emit(context.path);
                }
                break;
            default:
                break;
        }
        return true;
    }
    /**
     * Set the caption for widget title.
     *
     * @param widget - The target widget.
     */
    setCaption(widget) {
        let context = Private.contextProperty.get(widget);
        if (!context) {
            return;
        }
        let model = context.contentsModel;
        if (!model) {
            widget.title.caption = '';
            return;
        }
        context
            .listCheckpoints()
            .then((checkpoints) => {
            if (widget.isDisposed) {
                return;
            }
            let last = checkpoints[checkpoints.length - 1];
            let checkpoint = last ? coreutils_1.Time.format(last.last_modified) : 'None';
            let caption = `Name: ${model.name}\nPath: ${model.path}\n`;
            if (context.model.readOnly) {
                caption += 'Read-only';
            }
            else {
                caption +=
                    `Last Saved: ${coreutils_1.Time.format(model.last_modified)}\n` +
                        `Last Checkpoint: ${checkpoint}`;
            }
            widget.title.caption = caption;
        });
    }
    /**
     * Handle `'close-request'` messages.
     *
     * @param widget - The target widget.
     *
     * @returns A promise that resolves with whether the widget was closed.
     */
    onClose(widget) {
        // Handle dirty state.
        return this._maybeClose(widget)
            .then(result => {
            if (widget.isDisposed) {
                return true;
            }
            if (result) {
                widget.dispose();
            }
            return result;
        })
            .catch(error => {
            widget.dispose();
            throw error;
        });
    }
    /**
     * Dispose of widget regardless of widget's dirty state.
     *
     * @param widget - The target widget.
     */
    onDelete(widget) {
        widget.dispose();
        return Promise.resolve(void 0);
    }
    /**
     * Ask the user whether to close an unsaved file.
     */
    _maybeClose(widget) {
        // Bail if the model is not dirty or other widgets are using the model.)
        let context = Private.contextProperty.get(widget);
        if (!context) {
            return Promise.resolve(true);
        }
        let widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return Promise.resolve(true);
        }
        // Filter by whether the factories are read only.
        widgets = algorithm_1.toArray(algorithm_1.filter(widgets, widget => {
            let factory = Private.factoryProperty.get(widget);
            if (!factory) {
                return false;
            }
            return factory.readOnly === false;
        }));
        let factory = Private.factoryProperty.get(widget);
        if (!factory) {
            return Promise.resolve(true);
        }
        let model = context.model;
        if (!model.dirty || widgets.length > 1 || factory.readOnly) {
            return Promise.resolve(true);
        }
        let fileName = widget.title.label;
        return apputils_1.showDialog({
            title: 'Close without saving?',
            body: `File "${fileName}" has unsaved changes, close without saving?`,
            buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.warnButton()]
        }).then(result => {
            return result.button.accept;
        });
    }
    /**
     * Handle the disposal of a widget.
     */
    _widgetDisposed(widget) {
        let context = Private.contextProperty.get(widget);
        if (!context) {
            return;
        }
        let widgets = Private.widgetsProperty.get(context);
        if (!widgets) {
            return;
        }
        // Remove the widget.
        algorithm_1.ArrayExt.removeFirstOf(widgets, widget);
        // Dispose of the context if this is the last widget using it.
        if (!widgets.length) {
            context.dispose();
        }
    }
    /**
     * Handle the disposal of a widget.
     */
    _onWidgetDisposed(widget) {
        let disposables = Private.disposablesProperty.get(widget);
        disposables.dispose();
    }
    /**
     * Handle a file changed signal for a context.
     */
    _onFileChanged(context) {
        let widgets = Private.widgetsProperty.get(context);
        algorithm_1.each(widgets, widget => {
            this.setCaption(widget);
        });
    }
    /**
     * Handle a path changed signal for a context.
     */
    _onPathChanged(context) {
        let widgets = Private.widgetsProperty.get(context);
        algorithm_1.each(widgets, widget => {
            this.setCaption(widget);
        });
    }
}
exports.DocumentWidgetManager = DocumentWidgetManager;
/**
 * A private namespace for DocumentManager data.
 */
var Private;
(function (Private) {
    /**
     * A private attached property for a widget context.
     */
    Private.contextProperty = new properties_1.AttachedProperty({
        name: 'context',
        create: () => undefined
    });
    /**
     * A private attached property for a widget factory.
     */
    Private.factoryProperty = new properties_1.AttachedProperty({
        name: 'factory',
        create: () => undefined
    });
    /**
     * A private attached property for the widgets associated with a context.
     */
    Private.widgetsProperty = new properties_1.AttachedProperty({
        name: 'widgets',
        create: () => []
    });
    /**
     * A private attached property for a widget's disposables.
     */
    Private.disposablesProperty = new properties_1.AttachedProperty({
        name: 'disposables',
        create: () => new disposable_1.DisposableSet()
    });
})(Private || (Private = {}));
