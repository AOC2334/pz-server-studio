// Categories extracted from Project Zomboid 42.21 ServerSettingsScreen.lua.
const SettingsCategories = {
  "INI": [
    {
      "id": "Details",
      "label": "服务器信息",
      "keys": [
        "DefaultPort",
        "PublicName",
        "PublicDescription",
        "Public",
        "Password",
        "PauseEmpty",
        "ResetID"
      ]
    },
    {
      "id": "Steam",
      "label": "Steam 设置",
      "keys": [
        "UDPPort",
        "MaxAccountsPerUser",
        "SteamScoreboard"
      ]
    },
    {
      "id": "Backups",
      "label": "备份",
      "keys": [
        "BackupsCount",
        "BackupsOnStart",
        "BackupsOnVersionChange",
        "BackupsPeriod"
      ]
    },
    {
      "id": "SteamWorkshop",
      "label": "Steam 创意工坊设置",
      "keys": [
        "WorkshopItems"
      ]
    },
    {
      "id": "Mods",
      "label": "模组设置",
      "keys": [
        "Mods"
      ]
    },
    {
      "id": "Map",
      "label": "地图设置",
      "keys": [
        "Map"
      ]
    },
    {
      "id": "SpawnRegions",
      "label": "出生点设置",
      "keys": []
    },
    {
      "id": "Players",
      "label": "玩家设置",
      "keys": [
        "MaxPlayers",
        "Open",
        "DropOffWhiteListAfterDeath",
        "DisplayUserName",
        "ShowFirstAndLastName",
        "SpawnItems",
        "PingLimit",
        "ServerPlayerID",
        "SleepAllowed",
        "SleepNeeded",
        "PlayerRespawnWithSelf",
        "PlayerRespawnWithOther",
        "RemovePlayerCorpsesOnCorpseRemoval",
        "TrashDeleteAll",
        "PVPMeleeWhileHitReaction",
        "MouseOverToSeeDisplayName",
        "UsernameDisguises",
        "HideDisguisedUserName",
        "HidePlayersBehindYou",
        "PlayerBumpPlayer",
        "MapRemotePlayerVisibility",
        "AllowCoop",
        "ShowCoordinates"
      ]
    },
    {
      "id": "Admin",
      "label": "管理员",
      "keys": [
        "ClientCommandFilter",
        "ClientActionLogs",
        "PerkLogs",
        "DisableRadioStaff",
        "DisableRadioAdmin",
        "DisableRadioGM",
        "DisableRadioOverseer",
        "DisableRadioModerator",
        "DisableRadioInvisible"
      ]
    },
    {
      "id": "Fire",
      "label": "火焰设置",
      "keys": [
        "NoFire"
      ]
    },
    {
      "id": "PVP",
      "label": "PVP 设置",
      "keys": [
        "PVP",
        "SafetySystem",
        "ShowSafety",
        "SafetyToggleTimer",
        "SafetyCooldownTimer",
        "PVPMeleeDamageModifier",
        "PVPFirearmDamageModifier"
      ]
    },
    {
      "id": "Loot",
      "label": "资源",
      "keys": [
        "SafehousePreventsLootRespawn",
        "ItemNumbersLimitPerContainer"
      ]
    },
    {
      "id": "War",
      "label": "战争",
      "keys": [
        "War",
        "WarStartDelay",
        "WarDuration",
        "WarSafehouseHitPoints"
      ]
    },
    {
      "id": "Faction",
      "label": "阵营",
      "keys": [
        "Faction",
        "FactionDaySurvivedToCreate",
        "FactionPlayersRequiredForTag"
      ]
    },
    {
      "id": "Safehouse",
      "label": "安全屋设置",
      "keys": [
        "AdminSafehouse",
        "PlayerSafehouse",
        "SafehouseAllowTrepass",
        "SafehouseAllowFire",
        "SafehouseAllowLoot",
        "SafehouseAllowRespawn",
        "SafehouseDaySurvivedToClaim",
        "SafeHouseRemovalTime",
        "DisableSafehouseWhenOwnerConnected",
        "SafehouseAllowNonResidential",
        "SafehouseDisableDisguises"
      ]
    },
    {
      "id": "Chat",
      "label": "聊天设置",
      "keys": [
        "GlobalChat",
        "AnnounceDeath",
        "AnnounceAnimalDeath",
        "ServerWelcomeMessage",
        "ChatMessageCharacterLimit",
        "ChatMessageSlowModeTime"
      ]
    },
    {
      "id": "RCON",
      "label": "远程管理",
      "keys": [
        "RCONPort",
        "RCONPassword"
      ]
    },
    {
      "id": "Discord",
      "label": "Discord",
      "keys": [
        "DiscordEnable",
        "DiscordToken",
        "DiscordChatChannel",
        "DiscordLogChannel"
      ]
    },
    {
      "id": "UPnP",
      "label": "UPnP 设置",
      "keys": [
        "UPnP"
      ]
    },
    {
      "id": "Other",
      "label": "其他设置",
      "keys": [
        "DoLuaChecksum",
        "AllowDestructionBySledgehammer",
        "SledgehammerOnlyInSafehouse",
        "SaveWorldEveryMinutes",
        "AllowNonAsciiUsername"
      ]
    },
    {
      "id": "Vehicles",
      "label": "车辆",
      "keys": [
        "SpeedLimit"
      ]
    },
    {
      "id": "Voice",
      "label": "语音",
      "keys": [
        "VoiceEnable",
        "VoiceMinDistance",
        "VoiceMaxDistance",
        "Voice3D"
      ]
    }
  ],
  "Sandbox": [
    {
      "id": "TimeOptions",
      "label": "日期时间",
      "keys": [
        "DayLength",
        "TimeSinceApo",
        "StartMonth",
        "StartDay",
        "StartTime"
      ]
    },
    {
      "id": "Zombie",
      "label": "僵尸",
      "keys": [
        "Zombies",
        "Distribution",
        "ZombieVoronoiNoise",
        "ZombieRespawn",
        "ZombieMigrate",
        "ZombieLore.Speed",
        "ZombieLore.SprinterPercentage",
        "ZombieLore.Strength",
        "ZombieLore.Toughness",
        "ZombieLore.Transmission",
        "ZombieLore.Mortality",
        "ZombieLore.Reanimate",
        "ZombieLore.Cognition",
        "ZombieLore.DoorOpeningPercentage",
        "ZombieLore.CrawlUnderVehicle",
        "ZombieLore.Memory",
        "ZombieLore.Sight",
        "ZombieLore.Hearing",
        "ZombieLore.SpottedLogic",
        "ZombieLore.ThumpNoChasing",
        "ZombieLore.ThumpOnConstruction",
        "ZombieLore.ActiveOnly",
        "ZombieLore.TriggerHouseAlarm",
        "ZombieLore.ZombiesDragDown",
        "ZombieLore.ZombiesCrawlersDragDown",
        "ZombieLore.ZombiesFenceLunge",
        "ZombieLore.DisableFakeDead",
        "ZombieLore.ZombiesArmorFactor",
        "ZombieLore.ZombiesMaxDefense",
        "ZombieLore.ChanceOfAttachedWeapon",
        "ZombieLore.ZombiesFallDamage",
        "ZombieLore.PlayerSpawnZombieRemoval",
        "ZombieConfig.PopulationMultiplier",
        "ZombieConfig.PopulationStartMultiplier",
        "ZombieConfig.PopulationPeakMultiplier",
        "ZombieConfig.PopulationPeakDay",
        "ZombieConfig.RespawnHours",
        "ZombieConfig.RespawnUnseenHours",
        "ZombieConfig.RespawnMultiplier",
        "ZombieConfig.RedistributeHours",
        "ZombieConfig.FollowSoundDistance",
        "ZombieConfig.RallyGroupSize",
        "ZombieConfig.RallyGroupSizeVariance",
        "ZombieConfig.RallyTravelDistance",
        "ZombieConfig.RallyGroupSeparation",
        "ZombieConfig.RallyGroupRadius",
        "ZombieConfig.ZombiesCountBeforeDelete"
      ]
    },
    {
      "id": "Loot",
      "label": "物品",
      "keys": [
        "HoursForLootRespawn",
        "SeenHoursPreventLootRespawn",
        "MaxItemsForLootRespawn",
        "ConstructionPreventsLootRespawn",
        "MaximumLooted",
        "DaysUntilMaximumLooted",
        "RuralLooted",
        "MaximumDiminishedLoot",
        "DaysUntilMaximumDiminishedLoot",
        "MaximumLootedBuildingRooms",
        "FoodLootNew",
        "CannedFoodLootNew",
        "WeaponLootNew",
        "RangedWeaponLootNew",
        "AmmoLootNew",
        "MedicalLootNew",
        "SurvivalGearsLootNew",
        "MechanicsLootNew",
        "SkillBookLoot",
        "RecipeResourceLoot",
        "LiteratureLootNew",
        "ClothingLootNew",
        "ContainerLootNew",
        "KeyLootNew",
        "MediaLootNew",
        "MementoLootNew",
        "CookwareLootNew",
        "MaterialLootNew",
        "FarmingLootNew",
        "ToolLootNew",
        "OtherLootNew",
        "GeneratorSpawning",
        "LootItemRemovalList",
        "RemoveStoryLoot",
        "RemoveZombieLoot",
        "RollsMultiplier",
        "ZombiePopLootEffect"
      ]
    },
    {
      "id": "WorldOptions",
      "label": "世界设置",
      "keys": [
        "WaterShutModifier",
        "ElecShutModifier",
        "WaterShut",
        "ElecShut",
        "AlarmDecay",
        "Alarm",
        "LockedHouses",
        "FireSpread",
        "AllowExteriorGenerator",
        "GeneratorTileRange",
        "GeneratorVerticalPowerRange",
        "FuelStationGasInfinite",
        "FuelStationGasMin",
        "FuelStationGasMax",
        "FuelStationGasEmptyChance",
        "LightBulbLifespan",
        "FoodRotSpeed",
        "FridgeFactor",
        "DaysForRottenFoodRemoval",
        "WorldItemRemovalList",
        "HoursForWorldItemRemoval",
        "ItemRemovalListBlacklistToggle",
        "Basement.SpawnFrequency",
        "MaximumFireFuelHours"
      ]
    },
    {
      "id": "NatureOptions",
      "label": "环境设置",
      "keys": [
        "NightDarkness",
        "Temperature",
        "Rain",
        "MaxFogIntensity",
        "MaxRainFxIntensity",
        "ErosionSpeed",
        "ErosionDays",
        "FarmingSpeedNew",
        "CompostTime",
        "FishAbundance",
        "NatureAbundance",
        "PlantResilience",
        "FarmingAmountNew",
        "KillInsideCrops",
        "PlantGrowingSeasons",
        "PlaceDirtAboveground",
        "EnableTaintedWaterText",
        "MaximumRatIndex",
        "DaysUntilMaximumRatIndex"
      ]
    },
    {
      "id": "Meta",
      "label": "其他事件",
      "keys": [
        "Helicopter",
        "MetaEvent",
        "SleepingEvent",
        "GeneratorFuelConsumption",
        "SurvivorHouseChance",
        "VehicleStoryChance",
        "ZoneStoryChance",
        "AnnotatedMapChance",
        "HoursForCorpseRemoval",
        "DecayingCorpseHealthImpact",
        "ZombieHealthImpact",
        "BloodLevel",
        "BloodSplatLifespanDays",
        "MaggotSpawn",
        "MetaKnowledge",
        "DayNightCycle",
        "ZombieLore.FenceThumpersRequired",
        "ZombieLore.FenceDamageMultiplier",
        "Map.AllowWorldMap",
        "Map.AllowMiniMap",
        "Map.MapAllKnown",
        "Map.MapNeedsLight"
      ]
    },
    {
      "id": "Character",
      "label": "人物角色",
      "keys": [
        "StatsDecrease",
        "EndRegen",
        "Nutrition",
        "StarterKit",
        "CharacterFreePoints",
        "ConstructionBonusPoints",
        "InjurySeverity",
        "BoneFracture",
        "MuscleStrainFactor",
        "DiscomfortFactor",
        "WoundInfectionFactor",
        "ClothingDegradation",
        "NoBlackClothes",
        "RearVulnerability",
        "MultiHitZombies",
        "FirearmUseDamageChance",
        "FirearmNoiseMultiplier",
        "FirearmJamMultiplier",
        "FirearmMoodleMultiplier",
        "FirearmWeatherMultiplier",
        "FirearmHeadGearEffect",
        "AttackBlockMovements",
        "AllClothesUnlocked",
        "EnablePoisoning",
        "LiteratureCooldown",
        "NegativeTraitsPenalty",
        "MinutesPerPage",
        "LevelForDismantleXPCutoff",
        "LevelForMediaXPCutoff",
        "EasyClimbing",
        "SeeNotLearntRecipe",
        "MultiplierConfig.Global",
        "MultiplierConfig.GlobalToggle",
        "MultiplierConfig.Fitness",
        "MultiplierConfig.Strength",
        "MultiplierConfig.Sprinting",
        "MultiplierConfig.Lightfoot",
        "MultiplierConfig.Nimble",
        "MultiplierConfig.Sneak",
        "MultiplierConfig.Axe",
        "MultiplierConfig.Blunt",
        "MultiplierConfig.SmallBlunt",
        "MultiplierConfig.LongBlade",
        "MultiplierConfig.SmallBlade",
        "MultiplierConfig.Spear",
        "MultiplierConfig.Maintenance",
        "MultiplierConfig.Farming",
        "MultiplierConfig.Husbandry",
        "MultiplierConfig.Woodwork",
        "MultiplierConfig.Carving",
        "MultiplierConfig.Cooking",
        "MultiplierConfig.Electricity",
        "MultiplierConfig.Doctor",
        "MultiplierConfig.FlintKnapping",
        "MultiplierConfig.Masonry",
        "MultiplierConfig.Mechanics",
        "MultiplierConfig.Blacksmith",
        "MultiplierConfig.Pottery",
        "MultiplierConfig.Tailoring",
        "MultiplierConfig.MetalWelding",
        "MultiplierConfig.Aiming",
        "MultiplierConfig.Reloading",
        "MultiplierConfig.Fishing",
        "MultiplierConfig.PlantScavenging",
        "MultiplierConfig.Tracking",
        "MultiplierConfig.Trapping",
        "MultiplierConfig.Butchering",
        "MultiplierConfig.Glassmaking"
      ]
    },
    {
      "id": "Vehicle",
      "label": "汽车",
      "keys": [
        "EnableVehicles",
        "VehicleEasyUse",
        "RecentlySurvivorVehicles",
        "ZombieAttractionMultiplier",
        "CarSpawnRate",
        "ChanceHasGas",
        "InitialGas",
        "CarGasConsumption",
        "LockedCar",
        "CarGeneralCondition",
        "TrafficJam",
        "CarAlarm",
        "PlayerDamageFromCrash",
        "CarDamageOnImpact",
        "SirenShutoffHours",
        "DamageToPlayerFromHitByACar",
        "SirenEffectsZombies"
      ]
    },
    {
      "id": "Animal",
      "label": "畜牧设置",
      "keys": [
        "AnimalStatsModifier",
        "AnimalPregnancyTime",
        "AnimalEggHatch",
        "AnimalAgeModifier",
        "AnimalMilkIncModifier",
        "AnimalWoolIncModifier",
        "AnimalRanchChance",
        "AnimalGrassRegrowTime",
        "AnimalMetaPredator",
        "AnimalMatingSeason",
        "AnimalSoundAttractZombies"
      ]
    }
  ]
};
