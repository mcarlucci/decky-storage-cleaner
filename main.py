#!/usr/bin/env python3
import shutil
import os
import json
import math

import decky # type: ignore

homeDir = decky.DECKY_USER_HOME
pluginDir = decky.DECKY_PLUGIN_DIR

class Game:
    def __init__(self, appid, size, size_readable):
        self.appid = appid
        self.size = size
        self.size_readable = size_readable

class Plugin:
    @classmethod
    async def _listdirs(cls, rootdir):
        subdirectories = []
        for item in os.listdir(rootdir):
            subdirectories.append(item)
        
        return subdirectories
    
    @classmethod
    def _convert_size(cls, size_bytes):
        if size_bytes == 0:
            return "0B"
        size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return "%s %s" % (s, size_name[i])

    @classmethod
    async def get_size(cls, dirName, readable = False):
        size = 0
        for dirpath, dirnames, filenames in os.walk(homeDir + '/.steam/steam/steamapps/' + dirName):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                # skip if it is symbolic link
                if not os.path.islink(fp):
                    size += os.path.getsize(fp)
        if readable:
            return cls._convert_size(size)
        else:
            return size

    @classmethod
    async def list_games_with_temp_data(cls, dirName, sortBy = 'size'):
        # list of game appids on steam deck
        local_games = await cls._listdirs(homeDir + '/.steam/steam/steamapps/' + dirName)

        games_list = []
        for appid in local_games:
            dir_name = dirName + '/' + str(appid)
            size = await cls.get_size(dir_name)
            size_readable = cls._convert_size(size)
            game = Game(appid, size, size_readable)
            games_list.append(game)

        # sort list by game property, default to size (desc)
        sorted_local_games = sorted([obj.__dict__ for obj in games_list], key=lambda x: x[sortBy], reverse=True)

        return json.dumps(sorted_local_games)

    @classmethod
    async def delete_cache(cls, dirName):
        await shutil.rmtree(homeDir + '/.steam/steam/steamapps/' + dirName)