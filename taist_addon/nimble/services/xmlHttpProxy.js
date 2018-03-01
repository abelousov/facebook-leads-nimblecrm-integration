let _listening = false;

export default {
  onRequestFinish: function (responseHandler) {
    _responseHandlers.push(responseHandler);
    if (!_listening) {
      return _listenToRequests();
    }
  },
};

function _listenToRequests () {
  const originalSend = XMLHttpRequest.prototype.send;
  return XMLHttpRequest.prototype.send = function () {
    _listenForRequestFinish(this);
    return originalSend.apply(this, arguments);
  };
};

function _listenForRequestFinish (request) {
  const originalOnReadyStateChange = request.onreadystatechange;
  return request.onreadystatechange = function () {
    const finished = request.readyState === 4;
    if (finished) {
      for (let i = 0; i < _responseHandlers.length; i++) {
        const handler = _responseHandlers[i];
        handler(request);

        //TODO: remove handler if it's not needed anymore
      }
    }

    if (originalOnReadyStateChange) {
      originalOnReadyStateChange.apply(request, arguments);
    }
  };
};

const _responseHandlers = [];
