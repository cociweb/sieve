import logging

from urllib.parse import parse_qs, unquote

from ..websocket import WebSocket
from ..sieve.sievesocket import SieveSocket
from ..messagepump import MessagePump

class WebSocketHandler:

  def __init__(self, config):
    self.__config = config

  def can_handle_request(self, request) -> bool:
    if request.method != "GET":
      return False

    if not request.path.startswith("/websocket/"):
      return False

    return True

  def handle_request(self, context, request) -> None:

    logging.info(f"Websocket Request for {request.url}")

    account_id = request.path[len("/websocket/"):].split("?", 1)[0]

    account = self.__config.get_account_by_id(account_id)

    host = account.get_sieve_host()
    port = int(account.get_sieve_port())

    if request.query:
      params = parse_qs(request.query)
      if params.get("sieveHost") and params["sieveHost"][0]:
        host = unquote(params["sieveHost"][0])
      if params.get("sievePort") and params["sievePort"][0]:
        port = int(params["sievePort"][0])

    logging.info(f"ManageSieve backend {host}:{port} for account {account.get_name()}")

    # Websocket is read
    with WebSocket(request, context) as websocket:
      with SieveSocket(host, port) as sievesocket:

        sievesocket.start_tls()

        if not account.can_authenticate():
          logging.info(f"Do Proxy authentication for {account.get_name()}")
          sievesocket.authenticate(
            account.get_sieve_user(request),
            account.get_sieve_password(request),
            account.get_auth_username(request))

        # Publish capabilities to client...
        websocket.send(
          sievesocket.capabilities)

        MessagePump().run(websocket, sievesocket)
