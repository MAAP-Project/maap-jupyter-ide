import { PageConfig } from '@jupyterlab/coreutils'
import { request, RequestResult } from './request';

export function maapLogin(service, ticket) {
    return new Promise<RequestResult>((resolve, reject) => {
      
      var valuesUrl = new URL(PageConfig.getBaseUrl() + 'maapsec/login');
      valuesUrl.searchParams.append('service', service);
      valuesUrl.searchParams.append('ticket', ticket);

      request('get',valuesUrl.href).then((res: RequestResult) => {
        if (res.ok) {
          let attributes = JSON.parse(JSON.parse(res.data)['attributes']);
          resolve(attributes);
        } else {
          console.log(res);
          resolve(null);
        }
      });
    });
  }