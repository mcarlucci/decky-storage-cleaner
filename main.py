#!/usr/bin/env python3
import shutil
import os
import urllib.request
import json
import math

homeDir = os.environ['HOME']
pluginDir = os.environ['DECKY_PLUGIN_DIR']

class Game:
    def __init__(self, appid, name, size, size_readable):
        self.appid = appid
        self.name = name
        self.size = size
        self.size_readable = size_readable

class Plugin:
    async def _listdirs(self, rootdir):
        subdirectories = []
        for item in os.listdir(rootdir):
            subdirectories.append(item)
        
        return subdirectories
    
    def _convert_size(self, size_bytes):
        if size_bytes == 0:
            return "0B"
        size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return "%s %s" % (s, size_name[i])

    async def get_size(self, dirName, readable = False):
        size = 0
        for dirpath, dirnames, filenames in os.walk(homeDir + '/.steam/steam/steamapps/' + dirName):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                # skip if it is symbolic link
                if not os.path.islink(fp):
                    size += os.path.getsize(fp)
        if readable:
            return self._convert_size(self, size)
        else:
            return size

    async def list_games_with_temp_data(self, dirName, sortBy = 'size'):
        # try to fetch GetAppList url, otherwise fallback to static data (poor man's offline mode)
        try:
            response = urllib.request.urlopen('https://api.steampowered.com/ISteamApps/GetAppList/v0002/')
        except:
            response = open(pluginDir + '/GetAppListV0002.json')
        
        all_games = json.loads(response.read())['applist']['apps']
        # list of game appids on steam deck
        local_game_ids = await self._listdirs(self, homeDir + '/.steam/steam/steamapps/' + dirName)
        # filter all_games by local games appid
        games_found = list(filter(lambda d: str(d['appid']) in local_game_ids, all_games))

        games_list = []
        for game in games_found:
            dir_name = dirName + '/' + str(game['appid'])
            size = await self.get_size(self, dir_name)
            size_readable = self._convert_size(self, size)
            game = Game(game['appid'], game['name'], size, size_readable)
            games_list.append(game)

        # sort list by game property, default to size (desc)
        sorted_games_found = sorted([obj.__dict__ for obj in games_list], key=lambda x: x[sortBy], reverse=True)

        return json.dumps(sorted_games_found)

    async def delete_cache(self, dirName):
        await shutil.rmtree(homeDir + '/.steam/steam/steamapps/' + dirName)