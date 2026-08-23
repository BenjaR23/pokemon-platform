-- CreateTable
CREATE TABLE "PokemonSpecies" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" TEXT,
    "evolutionChainId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PokemonSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonSpeciesName" (
    "id" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PokemonSpeciesName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonVariety" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "speciesId" TEXT NOT NULL,

    CONSTRAINT "PokemonVariety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonForm" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "formName" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isBattleOnly" BOOLEAN NOT NULL DEFAULT false,
    "isMega" BOOLEAN NOT NULL DEFAULT false,
    "isGigantamax" BOOLEAN NOT NULL DEFAULT false,
    "varietyId" TEXT NOT NULL,
    "versionGroupId" TEXT,

    CONSTRAINT "PokemonForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Type" (
    "id" TEXT NOT NULL,
    "externalId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PokemonVarietyType" (
    "id" TEXT NOT NULL,
    "varietyId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "PokemonVarietyType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generations" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_groups" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generation_id" TEXT NOT NULL,

    CONSTRAINT "version_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "version_group_id" TEXT NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_areas" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "location_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abilities" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "abilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_variety_abilities" (
    "varietyId" TEXT NOT NULL,
    "abilityId" TEXT NOT NULL,

    CONSTRAINT "pokemon_variety_abilities_pkey" PRIMARY KEY ("varietyId","abilityId")
);

-- CreateTable
CREATE TABLE "pokemon_variety_stats" (
    "variety_id" TEXT NOT NULL,
    "hp" INTEGER NOT NULL,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "special_attack" INTEGER NOT NULL,
    "special_defense" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,

    CONSTRAINT "pokemon_variety_stats_pkey" PRIMARY KEY ("variety_id")
);

-- CreateTable
CREATE TABLE "evolution_chains" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,

    CONSTRAINT "evolution_chains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_triggers" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "evolution_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolutions" (
    "id" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "from_species_id" TEXT NOT NULL,
    "to_species_id" TEXT NOT NULL,
    "trigger_id" TEXT NOT NULL,

    CONSTRAINT "evolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_rules" (
    "id" TEXT NOT NULL,
    "evolution_id" TEXT NOT NULL,
    "minLevel" INTEGER,
    "itemId" TEXT,
    "minHappiness" INTEGER,
    "minBeauty" INTEGER,
    "minAffection" INTEGER,
    "timeOfDay" TEXT,
    "knownMoveId" TEXT,
    "knownTypeId" TEXT,
    "locationAreaId" TEXT,

    CONSTRAINT "evolution_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acquisition_types" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "acquisition_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_acquisitions" (
    "id" TEXT NOT NULL,
    "variety_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "acquisition_type_id" TEXT NOT NULL,

    CONSTRAINT "pokemon_acquisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_methods" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "encounter_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_encounters" (
    "id" TEXT NOT NULL,
    "acquisition_id" TEXT NOT NULL,
    "location_area_id" TEXT NOT NULL,
    "method_id" TEXT NOT NULL,

    CONSTRAINT "pokemon_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_encounter_details" (
    "id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "minLevel" INTEGER NOT NULL,
    "maxLevel" INTEGER NOT NULL,
    "chance" INTEGER,

    CONSTRAINT "pokemon_encounter_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_conditions" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "encounter_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounter_condition_values" (
    "id" TEXT NOT NULL,
    "external_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "condition_id" TEXT NOT NULL,

    CONSTRAINT "encounter_condition_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_encounter_detail_conditions" (
    "encounter_detail_id" TEXT NOT NULL,
    "condition_value_id" TEXT NOT NULL,

    CONSTRAINT "pokemon_encounter_detail_conditions_pkey" PRIMARY KEY ("encounter_detail_id","condition_value_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_collection_forms" (
    "id" TEXT NOT NULL,
    "user_collection_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_collection_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "species_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_profile_games" (
    "profile_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,

    CONSTRAINT "collection_profile_games_pkey" PRIMARY KEY ("profile_id","game_id")
);

-- CreateTable
CREATE TABLE "collection_profile_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "includeForms" BOOLEAN NOT NULL DEFAULT true,
    "includeVariants" BOOLEAN NOT NULL DEFAULT true,
    "includeEventOnly" BOOLEAN NOT NULL DEFAULT false,
    "includeUnavailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "collection_profile_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PokemonSpecies_externalId_key" ON "PokemonSpecies"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Language_externalId_key" ON "Language"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonSpeciesName_speciesId_languageId_key" ON "PokemonSpeciesName"("speciesId", "languageId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonVariety_externalId_key" ON "PokemonVariety"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonForm_externalId_key" ON "PokemonForm"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Type_externalId_key" ON "Type"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonVarietyType_varietyId_typeId_key" ON "PokemonVarietyType"("varietyId", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "PokemonVarietyType_varietyId_slot_key" ON "PokemonVarietyType"("varietyId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "generations_external_id_key" ON "generations"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "version_groups_external_id_key" ON "version_groups"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "games_external_id_key" ON "games"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "regions_external_id_key" ON "regions"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "locations_external_id_key" ON "locations"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_areas_external_id_key" ON "location_areas"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "abilities_external_id_key" ON "abilities"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "evolution_chains_external_id_key" ON "evolution_chains"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "evolution_triggers_external_id_key" ON "evolution_triggers"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_external_id_key" ON "items"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "acquisition_types_external_id_key" ON "acquisition_types"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_acquisitions_variety_id_game_id_acquisition_type_id_key" ON "pokemon_acquisitions"("variety_id", "game_id", "acquisition_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_methods_external_id_key" ON "encounter_methods"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_encounters_acquisition_id_location_area_id_method_i_key" ON "pokemon_encounters"("acquisition_id", "location_area_id", "method_id");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_conditions_external_id_key" ON "encounter_conditions"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_condition_values_external_id_key" ON "encounter_condition_values"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "encounter_condition_values_condition_id_name_key" ON "encounter_condition_values"("condition_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_collection_user_id_species_id_key" ON "user_collection"("user_id", "species_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_collection_forms_user_collection_id_form_id_key" ON "user_collection_forms"("user_collection_id", "form_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_favorites_user_id_species_id_key" ON "user_favorites"("user_id", "species_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_profiles_user_id_name_key" ON "collection_profiles"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "collection_profile_preferences_profile_id_key" ON "collection_profile_preferences"("profile_id");

-- AddForeignKey
ALTER TABLE "PokemonSpecies" ADD CONSTRAINT "PokemonSpecies_evolutionChainId_fkey" FOREIGN KEY ("evolutionChainId") REFERENCES "evolution_chains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSpeciesName" ADD CONSTRAINT "PokemonSpeciesName_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PokemonSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonSpeciesName" ADD CONSTRAINT "PokemonSpeciesName_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonVariety" ADD CONSTRAINT "PokemonVariety_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonForm" ADD CONSTRAINT "PokemonForm_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "PokemonVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonVarietyType" ADD CONSTRAINT "PokemonVarietyType_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "PokemonVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PokemonVarietyType" ADD CONSTRAINT "PokemonVarietyType_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version_groups" ADD CONSTRAINT "version_groups_generation_id_fkey" FOREIGN KEY ("generation_id") REFERENCES "generations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_version_group_id_fkey" FOREIGN KEY ("version_group_id") REFERENCES "version_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_areas" ADD CONSTRAINT "location_areas_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_variety_abilities" ADD CONSTRAINT "pokemon_variety_abilities_varietyId_fkey" FOREIGN KEY ("varietyId") REFERENCES "PokemonVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_variety_abilities" ADD CONSTRAINT "pokemon_variety_abilities_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "abilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_variety_stats" ADD CONSTRAINT "pokemon_variety_stats_variety_id_fkey" FOREIGN KEY ("variety_id") REFERENCES "PokemonVariety"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolutions" ADD CONSTRAINT "evolutions_chain_id_fkey" FOREIGN KEY ("chain_id") REFERENCES "evolution_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolutions" ADD CONSTRAINT "evolutions_from_species_id_fkey" FOREIGN KEY ("from_species_id") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolutions" ADD CONSTRAINT "evolutions_to_species_id_fkey" FOREIGN KEY ("to_species_id") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolutions" ADD CONSTRAINT "evolutions_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "evolution_triggers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_evolution_id_fkey" FOREIGN KEY ("evolution_id") REFERENCES "evolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_rules" ADD CONSTRAINT "evolution_rules_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_acquisitions" ADD CONSTRAINT "pokemon_acquisitions_variety_id_fkey" FOREIGN KEY ("variety_id") REFERENCES "PokemonVariety"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_acquisitions" ADD CONSTRAINT "pokemon_acquisitions_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_acquisitions" ADD CONSTRAINT "pokemon_acquisitions_acquisition_type_id_fkey" FOREIGN KEY ("acquisition_type_id") REFERENCES "acquisition_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounters" ADD CONSTRAINT "pokemon_encounters_acquisition_id_fkey" FOREIGN KEY ("acquisition_id") REFERENCES "pokemon_acquisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounters" ADD CONSTRAINT "pokemon_encounters_location_area_id_fkey" FOREIGN KEY ("location_area_id") REFERENCES "location_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounters" ADD CONSTRAINT "pokemon_encounters_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "encounter_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounter_details" ADD CONSTRAINT "pokemon_encounter_details_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "pokemon_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounter_condition_values" ADD CONSTRAINT "encounter_condition_values_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "encounter_conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounter_detail_conditions" ADD CONSTRAINT "pokemon_encounter_detail_conditions_encounter_detail_id_fkey" FOREIGN KEY ("encounter_detail_id") REFERENCES "pokemon_encounter_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_encounter_detail_conditions" ADD CONSTRAINT "pokemon_encounter_detail_conditions_condition_value_id_fkey" FOREIGN KEY ("condition_value_id") REFERENCES "encounter_condition_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection" ADD CONSTRAINT "user_collection_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection_forms" ADD CONSTRAINT "user_collection_forms_user_collection_id_fkey" FOREIGN KEY ("user_collection_id") REFERENCES "user_collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_collection_forms" ADD CONSTRAINT "user_collection_forms_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "PokemonForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profiles" ADD CONSTRAINT "collection_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profile_games" ADD CONSTRAINT "collection_profile_games_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "collection_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profile_games" ADD CONSTRAINT "collection_profile_games_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_profile_preferences" ADD CONSTRAINT "collection_profile_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "collection_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
