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

    logging.info(f"Websocket request: {request.url}")

    account_id = request.path[len("/websocket/"):].split("?", 1)[0]

    try:
      account = self.__config.get_account_by_id(account_id)
    except Exception as ex:
      logging.error(f"Unknown account id {account_id!r}: {ex}")
      raise

    host = account.get_sieve_host()
    port = int(account.get_sieve_port())

    if request.query:
      params = parse_qs(request.query)
      if params.get("sieveHost") and params["sieveHost"][0]:
        host = unquote(params["sieveHost"][0])
      if params.get("sievePort") and params["sievePort"][0]:
        port = int(params["sievePort"][0])

    auth_mode = "client" if account.can_authenticate() else "proxy"
    logging.info(
      f"ManageSieve backend {host}:{port} "
      f"(account {account.get_name()}, auth={auth_mode})")

    try:
      self._run_proxy(context, request, account, host, port)
    except Exception:
      logging.exception(
        f"Websocket proxy failed for {host}:{port} (account {account.get_name()})")
      raise

  def _run_proxy(self, context, request, account, host, port) -> None:
    with WebSocket(request, context) as websocket:
      with SieveSocket(host, port) as sievesocket:

        sievesocket.start_tls()

        if not account.can_authenticate():
          logging.info(f"Proxy authentication for {account.get_name()}")
          sievesocket.authenticate(
            account.get_sieve_user(request),
            account.get_sieve_password(request),
            account.get_auth_username(request))

        logging.info(f"Sending capabilities to browser for {account.get_name()}")
        websocket.send(sievesocket.capabilities)

        logging.info(f"Starting ManageSieve message pump for {account.get_name()}")
        MessagePump().run(websocket, sievesocket)
