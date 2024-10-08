import { call } from "@decky/api";
import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  staticClasses,
  DialogCheckbox,
  showModal,
  ConfirmModal
} from "@decky/ui";
import React, { FC, useState, useEffect } from "react";
import { FaBoxOpen } from "react-icons/fa";
import { getAppDetails } from "./utils";

interface Game {
  appid: string;
  size: number;
  size_readable: string;
  is_steam_game?: boolean;
  is_not_steam_cloud_supported?: boolean;
  name?: string;
}

const Content: FC = () => {
  const [gamesWithShaderCache, setGamesWithShaderCache] = useState<Game[]>([]);
  const [gamesWithCompatData, setGamesWithCompatData] = useState<Game[]>([]);
  const [totalShaderCacheSize, setTotalShaderCacheSize] = useState<string>("");
  const [totalCompatDataSize, setTotalCompatDataSize] = useState<string>("");
  const [selectedGamesWithShaderCache, setSelectedGamesWithShaderCache] = useState<string[]>([]);
  const [selectedGamesWithCompatData, setSelectedGamesWithCompatData] = useState<string[]>([]);

  // Initialize data
  useEffect(() => {
    const getGamesWithShaderCache = async () => await call<[string], any>("list_games_with_temp_data", "shadercache");
    getGamesWithShaderCache()
      .then(async res => setGamesWithShaderCache(await enrichGameList(JSON.parse(`${res as Game[]}`))))
      .catch(e => console.log(e.message))

    const getGamesWithCompatData = async () => await call<[string], any>("list_games_with_temp_data", "compatdata");
    getGamesWithCompatData()
      .then(async res => setGamesWithCompatData(await enrichGameList(JSON.parse(`${res as Game[]}`))))
      .catch(e => console.log(e.message))

    const getTotalShaderCacheSize = async () => await call<[string, boolean], any>("get_size", "shadercache", true);
    getTotalShaderCacheSize()
      .then(res => setTotalShaderCacheSize(res as string))
      .catch(e => console.log(e.message))
    
    const getTotalCompatDataSize = async () => await call<[string, boolean], any>("get_size", "compatdata", true);
    getTotalCompatDataSize()
      .then(res => setTotalCompatDataSize(res as string))
      .catch(e => console.log(e.message))
  }, [])

  // Methods
  function handleCheckboxSelection(checked: boolean, appid: string, cacheType: string) {
    if (cacheType.toLowerCase() === "shader") {
      let updatedList = [...selectedGamesWithShaderCache];
      if (checked) {
        updatedList = [...selectedGamesWithShaderCache, appid];
      } else {
        updatedList.splice(selectedGamesWithShaderCache.indexOf(appid), 1)
      }
      setSelectedGamesWithShaderCache(updatedList);
    }

    if (cacheType.toLowerCase() === "compat") {
      let updatedList = [...selectedGamesWithCompatData];
      if (checked) {
        updatedList = [...selectedGamesWithCompatData, appid];
      } else {
        updatedList.splice(selectedGamesWithCompatData.indexOf(appid), 1)
      }
      setSelectedGamesWithCompatData(updatedList);
    }
  }

  async function enrichGameList(gamesArr: Game[]): Promise<Game[]> {
    if (!gamesArr || gamesArr.length === 0) return [];
    const gameDetailsArr = await Promise.all(gamesArr.map(game => getAppDetails(parseInt(game.appid))));

    return gamesArr
      .map((game) => {
        const gameInfo = gameDetailsArr.find(gameDetails => gameDetails?.unAppID === parseInt(game.appid));
        game.name = gameInfo?.strDisplayName;
        game.is_steam_game = gameInfo?.iInstallFolder !== -1;
        game.is_not_steam_cloud_supported = gameInfo?.eCloudStatus === 1
        return game;
      })
      .filter(({ name, size }) => name && size)
  }
  
  async function clearDataCache(cacheDirName: string, appidArr?: string[]): Promise<void> {
    if (appidArr && appidArr.length > 0) {
      appidArr.forEach(async appid => await call<[string], any>("delete_cache", `${cacheDirName}/${appid}`));
    } else {
      await call<[string], any>("delete_cache", cacheDirName);
    }
  }

  // Templates
  const renderCheckbox = (game: Game, cacheType: string) => {
    return (
      <React.Fragment>
        <DialogCheckbox key={game.appid} label={`${game.name} (${game.size_readable})`} onChange={checked => handleCheckboxSelection(checked, game.appid.toString(), cacheType)}/>
        {cacheType === "compat" && game.is_not_steam_cloud_supported && <div style={{ fontSize: "12px", color: "red", margin: "0 0 12px 35px" }}>WARNING: This game DOES NOT support or has never synced to Steam Cloud Saves. ON-DEVICE GAME SAVE DATA MAY BE PERMANANTLEY LOST!</div>}
      </React.Fragment>
    );
  };

  const renderGameLists = (gamesArr: Game[], cacheType: string) => (
    <React.Fragment>
      <PanelSectionRow>
        <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "10px", display: gamesArr.some(({ is_steam_game }) => is_steam_game) ? "block" : "none" }}>
          STEAM
        </div>
      </PanelSectionRow>
      {gamesArr?.length > 0 && gamesArr.map(game => {
        if (!game.is_steam_game) return;
        return renderCheckbox(game, cacheType)
      })}
      <PanelSectionRow>
        <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "10px", display: gamesArr.some(({ is_steam_game }) => !is_steam_game) ? "block" : "none" }}>
          NON-STEAM
        </div>
      </PanelSectionRow>
      {gamesArr?.length > 0 && gamesArr.map(game => {
        if (game.is_steam_game) return;
        return renderCheckbox(game, cacheType)
      })}
    </React.Fragment>
  );
  
  // Render
  return (
    <div id="decky-storage-cleaner">
      <PanelSection title="Shader Cache" spinner={gamesWithShaderCache?.length === 0 && totalShaderCacheSize !== "0B"}>
        <PanelSectionRow>
          <div style={{ fontSize: "12px", marginBottom: "10px" }}>
            Shader cache is a precompiled collection of shader programs that helps reduce lag in graphics-intensive applications. It's ok to delete because it will be recreated the next time you run the application.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ fontSize: "17px", marginBottom: "10px" }}>
            Total Size: {totalShaderCacheSize?.length > 0 ? totalShaderCacheSize : "Calculating..."}
          </div>
        </PanelSectionRow>
        { renderGameLists(gamesWithShaderCache, "shader") }
        <React.Fragment>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              bottomSeparator="none"
              disabled={totalShaderCacheSize === "0B"}
              onClick={() => 
                showModal(
                  <ConfirmModal
                    onCancel={() => {}} 
                    onOK={async () => await clearDataCache("shadercache")}
                    strTitle={"Clear Shader Cache"}
                    strOKButtonText={"Clear"}
                  >
                    Are you sure you want to clear <strong>ALL</strong> shader cache?
                  </ConfirmModal>
                )
              }
            >
              Clear All Shader Cache
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              bottomSeparator="none"
              disabled={selectedGamesWithShaderCache.length === 0}
              onClick={() => 
                showModal(
                  <ConfirmModal
                    onCancel={() => {}} 
                    onOK={async () => await clearDataCache("shadercache", selectedGamesWithShaderCache)}
                    strTitle={"Clear Shader Cache"}
                    strOKButtonText={"Clear"}
                  >
                    Are you sure you want to clear the shader cache for <strong>{Array.from(gamesWithShaderCache.filter(({ appid }) => selectedGamesWithShaderCache.includes(appid.toString())).map(({ name }) => ` ${name}`)).toString()}</strong>?
                  </ConfirmModal>
                )
              }
            >
              Clear Selected Shader Cache
            </ButtonItem>
          </PanelSectionRow>
        </React.Fragment>
      </PanelSection>
      <PanelSection title="Compatibility Data" spinner={gamesWithCompatData?.length === 0 && totalCompatDataSize !== "0B"}>
        <PanelSectionRow>
          <div style={{ fontSize: "12px", marginBottom: "10px" }}>
            Compatibility data is information stored by your Steam Deck to ensure compatibility with hardware and other software. It's ok to delete because it will be recreated automatically as needed.
          </div>
        </PanelSectionRow>
        <PanelSectionRow>
          <div style={{ fontSize: "17px", marginBottom: "10px" }}>
            Total Size: {totalCompatDataSize?.length > 0 ? totalCompatDataSize : "Calculating..."}
          </div>
        </PanelSectionRow>
        { renderGameLists(gamesWithCompatData, "compat") }
        <React.Fragment>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              bottomSeparator="none"
              disabled={totalCompatDataSize === "0B"}
              onClick={() => 
                showModal(
                  <ConfirmModal
                    onCancel={() => {}} 
                    onOK={async () => await clearDataCache("compatdata")}
                    strTitle={"Clear Compatibility Data"}
                    strOKButtonText={"Clear"}
                  >
                    {gamesWithCompatData.filter(({ is_not_steam_cloud_supported }) => is_not_steam_cloud_supported).length > 0 && (
                      <div style={{ color: "red", marginBottom: "10px" }}>
                        <strong>DANGER: On-device game save data may be permanently lost for {Array.from(gamesWithCompatData.filter(({ appid, is_not_steam_cloud_supported }) => appid.toString() && is_not_steam_cloud_supported).map(({ name }) => ` ${name}`)).toString()}!</strong>
                      </div>
                    )}
                    <div>Are you sure you want to clear <strong>ALL</strong> compatibility data?</div>
                  </ConfirmModal>
                )
              }
            >
              Clear All Compat Data
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              bottomSeparator="none"
              disabled={selectedGamesWithCompatData.length === 0}
              onClick={() => 
                showModal(
                  <ConfirmModal
                    onCancel={() => {}} 
                    onOK={async () => await clearDataCache("compatdata", selectedGamesWithCompatData)}
                    strTitle={"Clear Compatibility Data"}
                    strOKButtonText={"Clear"}
                  >
                    {gamesWithCompatData.filter(({ appid, is_not_steam_cloud_supported }) => selectedGamesWithCompatData.includes(appid.toString()) && is_not_steam_cloud_supported).length > 0 && (
                      <div style={{ color: "red", marginBottom: "10px" }}>
                        <strong>DANGER: On-device game save data may be permanently lost for {Array.from(gamesWithCompatData.filter(({ appid, is_not_steam_cloud_supported }) => selectedGamesWithCompatData.includes(appid.toString()) && is_not_steam_cloud_supported).map(({ name }) => ` ${name}`)).toString()}!</strong>
                      </div>
                    )}
                    <div>Are you sure you want to clear the compatibility data for <strong>{Array.from(gamesWithCompatData.filter(({ appid }) => selectedGamesWithCompatData.includes(appid.toString())).map(({ name }) => ` ${name}`)).toString()}</strong>?</div>
                  </ConfirmModal>
                )
              }
            >
              Clear Selected Compat Data
            </ButtonItem>
          </PanelSectionRow>
        </React.Fragment>
      </PanelSection>
    </div>
  );
};

export default definePlugin(() => {
  return {
    title: <div className={staticClasses.Title}>Storage Cleaner</div>,
    content: <Content />,
    icon: <FaBoxOpen />,
  };
});