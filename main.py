#!/usr/bin/env python3
import shutil
import os
import json
import math

homeDir = os.environ['HOME']
pluginDir = os.environ['DECKY_PLUGIN_DIR']

class Game:
    def __init__(self, appid, size, size_readable):
        self.appid = appid
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
        # list of game appids on steam deck
        local_games = await self._listdirs(self, homeDir + '/.steam/steam/steamapps/' + dirName)

        games_list = []
        for appid in local_games:
            dir_name = dirName + '/' + str(appid)
            size = await self.get_size(self, dir_name)
            size_readable = self._convert_size(self, size)
            game = Game(appid, size, size_readable)
            games_list.append(game)

        # sort list by game property, default to size (desc)
        sorted_local_games = sorted([obj.__dict__ for obj in games_list], key=lambda x: x[sortBy], reverse=True)

        return json.dumps(sorted_local_games)

    async def delete_cache(self, dirName):
        await shutil.rmtree(homeDir + '/.steam/steam/steamapps/' + dirName)