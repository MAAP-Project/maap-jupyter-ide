//import * as React from 'react';

import { Widget } from '@phosphor/widgets';
import { ReactWidget } from '@jupyterlab/apputils';

function SandboxComponent() {
  return <div>My Widget</div>;
}
export class SandboxWidget extends ReactWidget {
  render() {
    return <SandboxComponent />;
  }
}
