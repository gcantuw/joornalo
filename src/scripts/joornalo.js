// private store for all subjects
const subjects = new WeakMap();
const configs = new WeakMap();

const createSubject = (context, key) => {
  const conf = configs.get(context);
  return typeof conf[key] === 'function' ? conf[key]() : new Rx.Subject();
};

const getSubject = (context, key) => {
  let v = subjects.get(context);
  if (!(key in v)) {
    v[key] = createSubject(context, key);
    subjects.set(context, v);
  }
  return v[key];
};

class requestEmitter {

  constructor(config) {
    subjects.set(this, Object.create(null));
    configs.set(this, config || {});
  }

  request(method, apiName, payload, successFn, errorFn) {

    let endpoint = 'http://localhost:9998/';
    let url;
    if (apiName.startsWith("http")) {
      url = apiName;
    } else {
      url = endpoint + apiName;
    }

    let eventName = url + String(Math.floor((Math.random() * 10000000) + 1));
    let token = '';

    let headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    let properties;

    properties = {
      method: method,
      headers: headers,
      cache: 'default'
    };

    if (method !== 'GET') {
      properties.body = JSON.stringify(payload);
    }

    let status;

    // this code needs some changes
    fetch(url, properties).then((response) => {
      status = response.status;
      if (status == 204) {
        return {};
      } else {
        return response.json();
      }
    }).then((data) => {
      data.status = status;

      this.publish(eventName, data);
    }).catch((err) => {
      this.publish(eventName, err);
    });

    return getSubject(this, eventName).subscribe(successFn, errorFn);
  }

  subject(name) {
    return getSubject(this, name).asObservable();
  }

  publish(name, data) {
    return getSubject(this, name).next(data);
  }
}

// Store
class AppAjax extends requestEmitter {
  constructor() {
    super({
      data: () => new Rx.ReplaySubject(1)
    });

    //this.publish('data',null);
  }
}

window.ajax = new AppAjax();



class Emitter {

  constructor(config) {
    subjects.set(this, Object.create(null));
    configs.set(this, config || {});
  }

  subscribe(name, successFn, errorFn) {
    return getSubject(this, name).subscribe(successFn, errorFn);
  }

  subject(name) {
    return getSubject(this, name).asObservable();
  }

  publish(name, data) {
    // let subj = getSubject(this, name);
    // subj.next(data);
    // return this;
    return getSubject(this, name).next(data);
  }
}

// Store
class AppStore extends Emitter {
  constructor() {
    super({
      data: () => new Rx.ReplaySubject(1)
    });

    //this.publish('data',null);
  }
}

window.store = new AppStore();