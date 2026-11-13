/**
 * Google Apps Script — Ju|'hoansi Blind Human Evaluation Form Builder
 * =====================================================================
 * How to create your Google Form in ~10 seconds:
 * 1. Go to https://script.new (signed into the Google account that will own the Form).
 * 2. Delete the placeholder code in Code.gs and paste this entire file.
 * 3. Click Save, then click Run -> createBlindEvalForm.
 * 4. Click "Review permissions" and allow Forms + Sheets access.
 * 5. Open the Execution Log at the bottom to copy:
 *      - Respondent Share URL (send to participants)
 *      - Form Edit URL (review / customize questions)
 *      - Linked Google Sheet URL (live responses for analysis)
 */

function getBlindStories_() {
  return [
    {
      slot: "Story A",
      trueArm: "authentic_corpus",
      sourceTitle: "The Honey and the Flies (Biesele Ch. 2, Dahm Ti N!a'an, Kauri 1971)",
      text:
        "People say that the god G!ara was the one who created the earth.\n\n" +
        "One day the cardinal woodpecker was looking around for honey, found the honey, and was chopping it. While he was chopping, G!ara came and sat down, and asked him for it. The woodpecker chopped it, chopped it, chopped it, and whistled. He whistled up the things he was carrying on a pole, and flat dishes. They flew up to him and he put the honey in them, put it in them, put the carrying pole of honey over his shoulder, and left him and went off.\n\n" +
        "And one day again, G!ara went again, came and found it and was chopping it, and the cardinal woodpecker came and sat down. Yes, he chopped it, chopped it, chopped it, and tried to imitate what the woodpecker had done, but failed to whistle up the things so they would come up to him so that he could carry them on his shoulders and leave.\n\n" +
        "They refused, so he just climbed down the tree and climbed back up, went and put it in, and put it over his shoulder there. He tried to fly, but fell down, and when he hit the ground, his stomach burst. The cardinal woodpecker came and took the honey things and left. Yes, mother, his stomach split and he just lay there.\n\n" +
        "They all came and gathered around him, and worked on his stomach, and worked on his stomach, and others came and just bit him until he cried. Do you know flies? Yes, mother, those little things here that are flies. Those flies came, laid their hands there as if standing, concentrated on sewing his midriff, and sewed, sewed, sewed and sewed it together. And he thanked them and said, \"Yes, my nephew, take me up.\" That's how he got up, yes, mother. That's how they have been doing things."
    },
    {
      slot: "Story B",
      trueArm: "full_jnang",
      sourceTitle: "jnang Story B (sharing_honey, 320 words, oral-aligned prompt)",
      text:
        "Kha||’an, the elder, sat by the campfire with his age-mate, Tci!xo. They watched the sun set behind the red sand dunes. \"I can smell the sweet zo (honey),\" Kha||’an said, his eyes sparkling. \"It’s time to gather some from the baobab tree!\" Tci!xo nodded, excited. \"Let’s go!\" They grabbed their carrying pole (!aro) and flat dishes (tan-l’osi) and set off into the Bush.\n\n" +
        "When they reached the baobab tree, they saw the cardinal woodpecker (!’aun!’aun) skillfully tapping away at the hollow trunk. \"Look how he gathers the honey!\" Tci!xo exclaimed. Kha||’an admired the woodpecker’s whistling as he lifted the dishes up to collect the precious zo. \"We must learn from him,\" Kha||’an said, and they watched closely.\n\n" +
        "But as they imitated the woodpecker, they could not make the same magic sounds. Tci!xo grew frustrated. \"I can do it!\" he shouted, trying to climb the tree. He slipped and fell hard onto the ground. Kha||’an rushed to his side. \"Tci!xo, are you hurt?\" Tci!xo groaned, rubbing his arm. \"No, but we need that honey!\"\n\n" +
        "Just then, a swarm of flies (zoaqzoaq) buzzed around them, drawn to the fallen honeycomb. \"Look!\" Kha||’an pointed. \"They can help us!\" The flies landed on Tci!xo’s arm, biting him lightly. \"Ouch!\" he yelped, but the buzzing grew louder, and they circled around the baobab. Suddenly, they lifted the dishes into the hollow tree, and honey began to pour out.\n\n" +
        "With the flies’ help, the brothers filled their dishes with the sweet zo. \"Let’s hurry back to camp and share this with the others!\" Tci!xo said. They dashed back to the fire, their hearts light with excitement.\n\n" +
        "Kha||’an called out to the others, \"We have honey!\" They gathered around, eager to taste. Tci!xo served the honey, and everyone laughed and shared stories as they enjoyed the sweet treat together. They celebrated the feast, grateful for the flies and the woodpecker, knowing that true joy comes from sharing."
    },
    {
      slot: "Story C",
      trueArm: "full_jnang",
      sourceTitle: "jnang Story C (drought_rain_animal, 326 words, oral-aligned prompt)",
      text:
        "N!aici, the hunter, walked and walked under the blazing sun, searching for waterholes. The drought had come, drying up the g!u (water), and all the animals and people suffered. He heard the whispers of the wind, carrying the cries of his kin at camp. They were preparing for a healing trance dance to honor the sacred rain-animal, !gà!n. “I must join them,” he thought.\n\n" +
        "As he approached the camp, he heard his age-mate, Di||xao, calling out, “N!aici, come! We need your strength for the dance!” They gathered around the warm fire, and the elders began to sing, their voices rising like the dust of the dry earth. The community came together, their hearts united in hope for rain. N!aici felt a stirring inside him, a longing for connection and respect for the land and its spirits.\n\n" +
        "But N!aici thought, “Why should I join? I can hunt alone and find water.” He wandered into the Bush, searching for hidden springs. There, he stumbled upon a small pool, shimmering under the sunlight. He drank deeply, but the water was bitter and dark. “This water is mine!” he declared, feeling powerful, but as he turned to leave, he saw a shadow, the spirit of !gà!n watching him closely.\n\n" +
        "The spirit spoke, “You take without giving. The rain belongs to all.” N!aici's heart sank, realizing his violation. He hurried back to camp, where the trance dance was in full swing. The rhythms echoed through the night, calling the rain-animals to the people. N!aici joined in, feeling the power of the dance, feeling the healing energy flow through him.\n\n" +
        "As dawn broke, the clouds gathered. The community danced and sang, and soon, raindrops began to fall. N!aici, filled with humility, shared the water he had found with everyone. They laughed and celebrated, drinking together from the shared bucket, their spirits lifted. That is why, to this day, the rain-animals are honored and the water is shared by all in the Kalahari."
    },
    {
      slot: "Story D",
      trueArm: "authentic_corpus",
      sourceTitle: "The Elephant First Found Water (Biesele Ch. 4, /Asa N!aan, Kauri 1971)",
      text:
        "Yes, my mother, the elephant was the one who first found water. He drank it alone, and hid it from people and drank it alone. And the mud stuck to his ankles, and then he went and lay down.\n\n" +
        "Then Beautiful Aardvark Girl said, \"People, people, what is it that this man now—is he a person who found water and is drinking without telling us?\" And her husband refused, and he said, \"I'm not drinking water, and it is plain sand which you see.\"\n\n" +
        "Mother, that was what he said. Earlier she had told her brothers and said, \"People, my husband perhaps found water and kept it secret from us, is being stingy to us. Come now, let us follow his spoor, and go to look for what he is drinking here.\" Do you understand me? And mother, they stood up and followed his spoor and tracked him and went and saw him, and he arrived and was drinking it, and went off gathering, because he is a person who obviously eats trees. Yes, mother.\n\n" +
        "He spent a long time eating trees, and they came together and drank it all up, and all their urine—they urinated the waterhole full. And he ate, ate the roots, and the sun was going down. He came and saw it lying there and thought maybe it was plain water, and came and dipped it up with that trunk of his, and wanted to drink it, but (clap!) it refused.\n\n" +
        "And just as he was turning around he saw the group of them sitting there. You understand, mother? He saw their group, saw them sitting, and there were many of them; they had spent the day heating and hammering spearpoints. My daughter, he went and saw his wife sitting in the midst of her brothers. He took out his trunk and tried to grab his wife. Her brothers walked and gathered together there, and they said, \"Yes, you are of course a woman, and men long ago did bad things to you, so today we are going to kill this elephant.\"\n\n" +
        "Spears met this way and that inside his body, if you were there watching, then these little birds of the rain—those that swerve this way and that way—that's how they stabbed the elephant. And that's how those birds today swerve this way and that, my daughter. And they rolled over that big elephant there, and he died, and they said, \"Yes, we have killed you.\"\n\n" +
        "So today people get a permit and go and kill an elephant. That's how the elephant walked, and he was the one who first found water. And rain has fallen; this one caused the rain to fall, this one said that rain should fall so people could drink water, and it was the elephant here, my daughter."
    },
    {
      slot: "Story E",
      trueArm: "authentic_corpus",
      sourceTitle: "Springhare Dances (Biesele Ch. 6, Dahm Ti N!a'an, Kauri 1971)",
      text:
        "The springhare was playing around at something and was making a sound like \"tcoqm-tcoqm-tcoqm,\" eating and making that sound. The springhare began to dance and was flipping up his tail as he was dancing.\n\n" +
        "And he came and watched the springhare, and watched the springhare, and said, \"Uh-uh, wait, let me go and go home and get from my son !Xuma the dancing skin, and come back and give it to you so you can tie it on yourself and dance and I can watch you.\"\n\n" +
        "He ran off and got it and hurried and came back and gave it to him, and he tied it on himself and danced it again. Hmm, he spent the day watching him and watching him, and the rain began to fall—\"hoq\"—imitating the sound of the rain.\n\n" +
        "\"Hey, give me the dancing skin so I can go home, give it to me, rain is coming,\" he said, but Springhare refused. He danced and danced and a heavy rain settled in, beat him hard, beat his dancing skin to pieces. He just sat and watched the springhare, and the springhare was afraid and went and entered a hole. The rain beat him hard, and he left there and went home, hurried and grabbed...\n\n" +
        "Now granddaughter, the springhare hook people use today to pull out springhares—he took that springhare hook, took that digging stick, came and he again did that, jumped and went over here, and he beat him with the digging stick on the small of his back and knocked him down. Granddaughter, yes."
    },
    {
      slot: "Story F",
      trueArm: "full_jnang",
      sourceTitle: "jnang Story F (eland_hunt_arrow, 425 words, oral-aligned prompt)",
      text:
        "Kgao, the young hunter, stood by the waterhole, his eyes scanning the horizon. The land was dry, and the animals were scarce. His uncle (!o) |'Oma had told him to wait for the right moment, but Kgao's impatience gnawed at him. \"I will track the great eland alone,\" he boasted to the other hunters, gripping his blessed arrow tightly. \"I will bring back meat for myself!\"\n\n" +
        "His age-mate (!xo) Toma shook his head. \"You must not go alone, Kgao. The Bush is wild, and the eland is cunning.\" But Kgao was determined. He left the camp with a fierce spirit, walking and walking into the vastness of the Kalahari.\n\n" +
        "As he ventured deeper into the Bush, Kgao found the fresh tracks of the great eland. He followed them, his heart pounding with excitement. Suddenly, he spotted the magnificent animal grazing beneath a thorn tree. He drew back his arrow, remembering the blessing it had received. But just as he was about to release it, a rustle in the grass startled the eland, and it bolted away. Frustrated, Kgao chased after it, running and running until he was far from the camp.\n\n" +
        "The sun began to set, and Kgao realized he had lost his way. He called out for Toma, for his uncle, but only silence answered him. Alone in the darkening Bush, he felt fear creep into his heart. The shadows danced around him, and he remembered the stories of the g//awasi, the ancestral spirits. He sat beneath a great baobab tree, humbled and shivering.\n\n" +
        "Just then, he heard a voice, soft and soothing. \"Kgao, you must share your hunt with your kin. Only then will you find your way home.\" It was the voice of a wise spirit. Understanding washed over him. He had acted selfishly, thinking only of himself.\n\n" +
        "With renewed determination, Kgao rose and retraced his steps. Following the tracks again, he spotted the eland once more. This time, he took a deep breath, steadied his heart, and aimed carefully. The arrow flew true, and the eland fell. Kgao felt joy, but it was not for him alone; he thought of his uncle, his age-mate, and the camp.\n\n" +
        "Kgao returned to the camp, bringing the meat with him. \"I hunted this eland for all of us,\" he declared, sharing the meat around the fire. Everyone gathered and rejoiced. They sang songs of the hunt, and the camp was filled with laughter and gratitude. That is why, to this day, the hunters always share their catch, remembering Kgao's lesson of humility and community."
    }
  ];
}

function addStoryEvaluationSection_(form, story, index, total) {
  var header = form.addPageBreakItem()
    .setTitle(story.slot + " (" + (index + 1) + " of " + total + ")")
    .setHelpText("Please read the story below carefully before answering the questions.");

  form.addSectionHeaderItem()
    .setTitle("Read " + story.slot)
    .setHelpText(story.text);

  // 1. Equality
  form.addMultipleChoiceItem()
    .setTitle("[" + story.slot + "] 1. Equality — Does anyone end up above the others, with status, sole credit, or goods, unchallenged?")
    .setChoiceValues([
      "No — everyone ends on equal footing, or boasting/hoarding is brought back down",
      "Partially — sharing happens, yet one character still feels elevated above the rest",
      "Yes — an individual ends up with higher status, praise, or goods unchallenged",
      "Unclear / does not apply"
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle("[" + story.slot + "] 1b. Equality Rating — How faithfully does this story reflect Ju|'hoansi egalitarian values?")
    .setBounds(1, 5)
    .setLabels("1 = Promotes status / hierarchy", "5 = Strongly upholds equality")
    .setRequired(true);

  // 2. Sharing
  form.addMultipleChoiceItem()
    .setTitle("[" + story.slot + "] 2. Sharing — Is food and water shared the way it should be in Ju|'hoansi culture, and does that drive the story?")
    .setChoiceValues([
      "Yes — sharing (or refusal to share) drives the plot naturally from start to finish",
      "Mentioned mainly as a stated moral/speech rather than driving the plot",
      "No — food, water, or meat is hoarded or handled in an unnatural way",
      "Food and water are not central to this story"
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle("[" + story.slot + "] 2b. Sharing Rating — How culturally natural is the handling of food, water, or hunting bounty?")
    .setBounds(1, 5)
    .setLabels("1 = Unnatural / artificial", "5 = True to Ju|'hoansi practice")
    .setRequired(true);

  // 3. Kinship
  form.addMultipleChoiceItem()
    .setTitle("[" + story.slot + "] 3. Kinship & Exchange — Are terms like !ga, !o, !xo, n!ama, hxaro (or kin roles) used correctly, as real relationships?")
    .setChoiceValues([
      "Yes — used accurately as real kinship roles or exchange relationships",
      "Mixed — recognizable words appear, but some are misused (e.g., as personal names or wrong practice)",
      "No — kinship or hxaro terms are clearly misused or forced in",
      "No specific Ju|'hoansi kin/hxaro terms appear / I am not sure"
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle("[" + story.slot + "] 3b. Which kinship or exchange detail (e.g., !ga, !o, !xo, n!ama, hxaro) felt accurate or felt wrong?")
    .setRequired(false);

  // 4. Story Shape
  form.addScaleItem()
    .setTitle("[" + story.slot + "] 4. Story Shape — Does it start, turn, and end the way a Ju|'hoansi story does?")
    .setBounds(1, 5)
    .setLabels("1 = Reads like a Western fable/essay", "5 = Sounds like a real Ju|'hoansi telling")
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("[" + story.slot + "] 4b. Storytelling Voice & Setting (check any that stand out)")
    .setChoiceValues([
      "Natural oral rhythm and understatement",
      "Closing sounds like a neat textbook/Western moral ('they learned that...')",
      "Characters sound overly scripted or melodramatic",
      "Physical Kalahari life (waterholes, animals, hunting, camp/bush) feels authentic",
      "Ecological or cultural details clash with Ju|'hoansi life"
    ])
    .setRequired(false);

  // 5. Blind Provenance
  form.addMultipleChoiceItem()
    .setTitle("[" + story.slot + "] 5. Blind Assessment — In your judgement, who produced this story?")
    .setChoiceValues([
      "Told by a Ju|'hoansi storyteller (authentic oral tradition)",
      "Generated by an AI system prompted with Ju|'hoansi context",
      "Cannot tell"
    ])
    .setRequired(true);

  form.addTextItem()
    .setTitle("[" + story.slot + "] 5b. What single clue in the story most influenced your answer above?")
    .setRequired(false);

  return header;
}

function createBlindEvalForm() {
  var stories = getBlindStories_();

  var form = FormApp.create("Ju|'hoansi Oral Tradition — Blind Story Evaluation Study");
  form.setDescription(
    "Thank you for taking part in this research evaluation.\n\n" +
    "You will read six short stories written in English. Some come directly from documented Ju|'hoansi oral tellings, and others were produced by a computer story-generation system. " +
    "Because this is a blind evaluation, the order is mixed and no labels are shown.\n\n" +
    "For each story, please judge four things: (1) Equality, (2) Sharing of food and water, (3) Kinship & hxaro relationships, and (4) Story shape — plus whether it reads like a real Ju|'hoansi telling.\n" +
    "Estimated time: 15–20 minutes."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    "Thank you for completing this evaluation! Your responses have been recorded and will help evaluate and improve culturally grounded Ju|'hoansi narrative tools."
  );

  // Part 1: Consent & Profile
  var consentItem = form.addMultipleChoiceItem()
    .setTitle("1. Informed Consent — Do you agree for your anonymous ratings and written feedback to be used in this Master's research study?")
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle("2. What is your connection to Ju|'hoansi language and storytelling? (Check all that apply)")
    .setChoiceValues([
      "Ju|'hoansi community member / speaker",
      "Regularly hear or tell traditional Ju|'hoansi stories",
      "Southern African San / folklore researcher",
      "General reader (little prior familiarity with Ju|'hoansi stories)"
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle("3. How familiar are you with Ju|'hoan kinship and social terms (!ga, !o, !xo, n!ama, hxaro)?")
    .setChoiceValues([
      "Very familiar (use or know them in lived experience)",
      "Somewhat familiar (from study or reading)",
      "Not familiar"
    ])
    .setRequired(true);

  // Part 2: 6 Story Sections
  for (var i = 0; i < stories.length; i++) {
    addStoryEvaluationSection_(form, stories[i], i, stories.length);
  }

  // Part 3: Final Comparison
  var finalSection = form.addPageBreakItem()
    .setTitle("Final Comparison Across All Six Stories");

  form.addMultipleChoiceItem()
    .setTitle("Which single story felt MOST authentic to Ju|'hoansi oral storytelling?")
    .setChoiceValues(stories.map(function (s) { return s.slot; }))
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("Which story felt MOST artificial or Westernised, and what gave it away?")
    .setRequired(false);

  form.addParagraphTextItem()
    .setTitle("Any recurring mistakes or improvements you noticed across the stories (kinship terms, sharing logic, endings, tone)?")
    .setRequired(false);

  // Wire Consent "No" branch to submit immediately
  consentItem.setChoices([
    consentItem.createChoice("Yes, I consent to participate", FormApp.PageNavigationType.CONTINUE),
    consentItem.createChoice("No, I do not wish to participate", FormApp.PageNavigationType.SUBMIT)
  ]);

  // Link response Spreadsheet
  var sheet = SpreadsheetApp.create("Ju|'hoansi Blind Evaluation — Responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  Logger.log("=== FORM CREATED SUCCESSFULLY ===");
  Logger.log("Share with participants (Published URL): " + form.getPublishedUrl());
  Logger.log("Edit Form URL: " + form.getEditUrl());
  Logger.log("Linked Responses Sheet URL: " + sheet.getUrl());
  Logger.log("=== BLIND KEY (DO NOT SHARE WITH PARTICIPANTS) ===");
  for (var j = 0; j < stories.length; j++) {
    Logger.log(stories[j].slot + " => " + stories[j].trueArm + " (" + stories[j].sourceTitle + ")");
  }
}

/**
 * Non-destructive updater: preserves your edited questions (such as your
 * updated egalitarianism wording) and keeps Authentic Stories A, D, and E
 * untouched, replacing ONLY Stories B, C, and F in-place on your live Form.
 */
function updateLiveFormStoriesOnly() {
  var FORM_ID = "1vruncoTcWYlJdbRaS7es5mwwtnCyHgugG2fMeVki2r4";
  var form = FormApp.openById(FORM_ID);
  var stories = getBlindStories_();
  var byReadTitle = {};
  for (var i = 0; i < stories.length; i++) {
    byReadTitle["Read " + stories[i].slot] = stories[i];
  }

  var items = form.getItems(FormApp.ItemType.SECTION_HEADER);
  var updated = [];
  for (var k = 0; k < items.length; k++) {
    var sec = items[k].asSectionHeaderItem();
    var title = sec.getTitle();
    var st = byReadTitle[title];
    if (st && st.trueArm === "full_jnang") {
      sec.setHelpText(st.text);
      updated.push(st.slot);
    }
  }

  Logger.log("=== IN-PLACE STORY UPDATE COMPLETE ===");
  Logger.log("Updated generated stories: " + updated.join(", "));
  Logger.log("Preserved all existing questions and authentic stories (Story A, Story D, Story E).");
  Logger.log("Edit Form URL: " + form.getEditUrl());
  Logger.log("Published URL: " + form.getPublishedUrl());
}
