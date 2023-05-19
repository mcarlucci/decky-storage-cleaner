# Storage Cleaner (Decky Loader Plugin)

A [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) plugin for tidying up your Steam Deck's storage (and getting rid of that pesky 'Other' storage eating it all up)! Quickly visualize, select and clear shader cache and compatibility data.

## Features

- Get disk usage data for your Steam Deck's shader cache and compatibility data
- Identify Steam and Non-Steam games
- Selectively clear the shader cache and compatibility data you don't want
- Clear all the shader cache or compatibility data all at once

![](assets/Screenshot-1.png)

![](assets/Screenshot-2.png)

## Installation

1. If you haven't already, install [Decky Loader](https://deckbrew.xyz/) on your Steam Deck.
2. With Decky Loader installed, press the Quick Access button on your Steam Deck.
3. Navigate to the Plug icon (Decky) and press the Gear icon (settings).
4. Find Storage Cleaner and press "Install".

## Support My Work

Storage Cleaner is completely free-to-use. It is built and maintained in my spare time. With your help I can remain caffeinated and awake - squashing bugs, adding features and creating more useful plugins.

<a href="https://www.buymeacoffee.com/mcarlucci" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy Me A Coffee" height="41" width="174"></a>

## Possible Future Features

- Support microsd storage (move/clear)...?
- Clear depotcache...?
- Small disk analyser/visualizer...?
- Auto/scheduled cache cleanups...?
- Identify games with games saves stored in compatdata...?
- Empty Trash directory...?

## Methodologies

### Getting Shader Cache and Compat Data

- Native Python file methods are used to get all of the subdirectories in the `home/deck/.steam/steam/steamapps/shadercache` and `home/deck/.steam/steam/steamapps/compatdata` parent directories
- Each subdirectory name is a steam appid/gameid

### Getting Steam and Non-Steam App Names/Types

- Since each game directory name is an appid/gameid, it can be used to fetch the game name via the client side Steam `appStore.GetAppOverviewByGameID(game.appid)` method. This method returns an object with a `display_name` property, which is the name of the corresponding steam or non-steam game

- `appStore.GetAppOverviewByGameID(game.appid)` also returns the `app_type` property, which is used to differentiate between Steam and Non-Steam games

### Clearing Shader Cache and Compat Data

- Game specific shader cache is deleted recursively by appid (directory name) using the `shutil.rmtree('home/deck/.steam/steam/steamapps/shadercache/<appId>')` native Python method
  
  > Shader Cache will regerenerate either during gameplay or preemptively via OTA (over the air) updates via Steam

### Detecting Games That Don't Support or Have Never Synced to Steam Cloud Saves

- `appStore.GetAppOverviewByGameID(game.appid)` returns the `local_per_client_data.cloud_status` object/property, which is used to check if an installed game is/has ever synced to Steam Cloud Saves
