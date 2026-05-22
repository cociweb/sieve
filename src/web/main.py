import pathlib
import logging

from argparse import ArgumentParser

from script.webserver import WebServer

from script.handler.config import ConfigHandler
from script.handler.file import FileHandler
from script.handler.websocket import WebSocketHandler

from script.config.config import Config


parser = ArgumentParser(description='Starts the websocket to sieve proxy.')
parser.add_argument("--config", help="The configuration file if omitted it will fallback to ./config.ini")
parser.add_argument('--verbose', '-v', action='count', default=1)
parser.add_argument('--dev', action='store_true',
  help='Development mode: serve static files and use HTTPS when certificates are configured')
parser.add_argument('--host', help='Bind address (overrides config ServerAddress)')
parser.add_argument('--port', type=int, help='Bind port (overrides config ServerPort)')

args = parser.parse_args()

args.verbose = 40 - (10*args.verbose) if args.verbose > 0 else 0

logging.basicConfig(level=args.verbose, format='%(asctime)s %(levelname)s [%(funcName)s] %(filename)s : %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

if args.config is None:
  args.config = "config.ini"

configfile = pathlib.Path(
  pathlib.Path(__file__).parent.absolute(),
  args.config)

if not configfile.exists():
  raise Exception(f"No such config file {configfile}")

print(f"Loading config from {configfile}")
config = Config().load(configfile)

address = args.host if args.host else config.get_address()
port = args.port if args.port else config.get_port()

if not args.dev:
  address = args.host if args.host else "127.0.0.1"

use_tls = False
keyfile = None
certfile = None

if args.dev:
  keyfile = config.get_keyfile()
  certfile = config.get_certfile()
  if keyfile and certfile and pathlib.Path(keyfile).exists() and pathlib.Path(certfile).exists():
    use_tls = True

webServer = WebServer(
  address=address,
  port=port,
  keyfile=keyfile,
  certfile=certfile,
  use_tls=use_tls)

webServer.add_handler(ConfigHandler(config))

if args.dev:
  webServer.add_handler(FileHandler(str(config.get_http_root())))

webServer.add_handler(WebSocketHandler(config))

webServer.listen()
