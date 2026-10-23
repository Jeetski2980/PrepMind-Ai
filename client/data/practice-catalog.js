function topic(name, description, application) {
  return { name, description, application };
}

const AP_COURSES = [
  {
    subject: "AP 2-D Art and Design",
    topics: [
      topic("Elements and Principles", "How line, shape, color, value, space, texture, and design principles organize a two-dimensional image.", "an artist adjusts contrast and balance to guide a viewer through a flat composition"),
      topic("Materials and Processes", "How artists select and control two-dimensional media, tools, and processes to communicate an idea.", "an artist tests layering, erasure, and surface texture before choosing a final process"),
      topic("Visual Analysis", "How close observation of visual choices supports an interpretation of an artwork.", "a viewer explains how repeated shapes and color changes create emphasis"),
      topic("Portfolio Development", "How a sustained inquiry, experimentation, revision, and reflection form a coherent portfolio.", "a student selects related works and explains how revisions developed an inquiry"),
    ],
  },
  {
    subject: "AP 3-D Art and Design",
    topics: [
      topic("Elements and Principles", "How form, volume, space, texture, and design principles shape a three-dimensional work.", "a sculptor changes scale and negative space to affect how a viewer moves around a work"),
      topic("Materials and Processes", "How material properties and construction methods influence a three-dimensional artwork.", "an artist compares the stability and surface qualities of clay, wire, and found materials"),
      topic("Spatial Relationships", "How a three-dimensional work relates to surrounding space, viewpoint, scale, and the viewer.", "a student studies how changing a sculpture's placement changes its relationship to a room"),
      topic("Portfolio Development", "How sustained inquiry, experimentation, revision, and reflection form a coherent portfolio.", "a student selects related works and explains how revisions developed an inquiry"),
    ],
  },
  {
    subject: "AP Drawing",
    topics: [
      topic("Line, Shape, and Form", "How line, shape, and form communicate structure, movement, and meaning in drawing.", "an artist uses changes in line weight to distinguish a figure from its setting"),
      topic("Composition and Space", "How placement, perspective, and positive and negative space organize a drawing.", "a student revises a composition to make the focal point more apparent"),
      topic("Media and Technique", "How drawing materials and techniques affect mark, surface, and visual expression.", "an artist compares charcoal and graphite to create different tonal effects"),
      topic("Portfolio Development", "How sustained inquiry, experimentation, revision, and reflection form a coherent portfolio.", "a student selects related works and explains how revisions developed an inquiry"),
    ],
  },
  {
    subject: "AP African American Studies",
    topics: [
      topic("Origins of the African Diaspora", "How African societies, the transatlantic slave trade, and diaspora communities shaped shared and distinct histories.", "a historian traces how forced migration transformed cultural practices across the Atlantic"),
      topic("Freedom, Enslavement, and Resistance", "How African-descended people experienced slavery and organized individual and collective resistance.", "a student compares escape narratives, rebellions, and everyday acts of resistance"),
      topic("Reconstruction and Civil Rights", "How struggles over citizenship, political power, and civil rights changed across U.S. history.", "a researcher connects Reconstruction amendments to later campaigns for voting access"),
      topic("Culture, Identity, and Global Connections", "How Black cultural expression and political thought developed through local and global exchange.", "a class studies how music and writing carried ideas between Black communities"),
    ],
  },
  {
    subject: "AP Art History",
    topics: [
      topic("Ancient and Classical Art", "How ancient works reflect the beliefs, political structures, materials, and social practices of their cultures.", "a viewer relates a monument's scale and imagery to the authority of its patron"),
      topic("Global Artistic Traditions", "How artistic traditions across regions communicate cultural values through form, material, and use.", "a student compares the ritual functions of works made in different societies"),
      topic("Renaissance to Modern Art", "How artists from the Renaissance through modern periods responded to changing patrons, ideas, and technology.", "a student traces how new materials and theories changed artistic practice"),
      topic("Visual and Contextual Analysis", "How formal analysis and historical context work together to support an interpretation of art.", "a student uses composition and documented context to support a claim about an artwork"),
    ],
  },
  {
    subject: "AP Biology",
    topics: [
      topic("Cell Biology", "How cell structures, membranes, energy transformations, and communication support life.", "a lab group predicts how a membrane protein affects movement into a cell"),
      topic("Genetics", "How DNA, gene expression, inheritance, and variation transmit biological information.", "a student uses a pedigree and allele data to predict an inherited trait"),
      topic("Evolution", "How heritable variation and differential reproductive success change populations over generations.", "researchers compare trait frequencies before and after an environmental change"),
      topic("Ecology", "How organisms interact with each other and with abiotic conditions in populations and ecosystems.", "a student predicts how removing a consumer affects a food web"),
    ],
  },
  {
    subject: "AP Business with Personal Finance",
    topics: [
      topic("Personal Financial Planning", "How goals, budgets, saving, and risk choices shape a person's financial plan.", "a student compares a monthly budget with a savings goal and expected expenses"),
      topic("Credit and Borrowing", "How credit history, interest, repayment terms, and borrowing risk affect financial decisions.", "a consumer compares two loans with different rates and repayment periods"),
      topic("Income, Taxes, and Spending", "How income, payroll deductions, taxes, and spending choices affect take-home resources.", "a worker estimates take-home pay after deductions and plans monthly spending"),
      topic("Saving, Investing, and Protection", "How saving, investing, insurance, and diversification address future needs and financial risk.", "a household weighs an emergency fund against an investment with variable returns"),
    ],
  },
  {
    subject: "AP Calculus AB",
    topics: [
      topic("Limits", "How limits describe the value a function approaches and support continuity and derivative definitions.", "a student examines a graph near a hole to determine the value approached from both sides"),
      topic("Derivatives", "How derivatives represent instantaneous rates of change and the slopes of tangent lines.", "a modeler uses a position function to find an object's velocity at one instant"),
      topic("Integrals", "How definite integrals accumulate quantities and connect to antiderivatives.", "a student accumulates changing rates to find total distance over a time interval"),
      topic("Applications", "How derivative and integral ideas model change, optimization, and accumulated quantities.", "an engineer uses a rate model to optimize a design under a constraint"),
    ],
  },
  {
    subject: "AP Calculus BC",
    topics: [
      topic("Series", "How sequences and series represent limits and sums, including tests for convergence and power series.", "a student uses a convergence test to decide whether an infinite sum has a finite value"),
      topic("Parametric Equations", "How parametric equations describe a curve by expressing coordinates as functions of a parameter.", "a model gives horizontal and vertical position as functions of time"),
      topic("Polar Coordinates", "How polar coordinates locate points by distance and angle and describe curves in the plane.", "a student interprets a graph defined by radius as a function of angle"),
      topic("Advanced Integration", "How integration techniques and improper integrals evaluate accumulated quantities in broader settings.", "a student selects substitution or parts to evaluate an integral with a composite expression"),
    ],
  },
  {
    subject: "AP Chemistry",
    topics: [
      topic("Atomic Structure", "How atomic particles, electron configurations, and periodic patterns explain chemical behavior.", "a student uses electron configuration to compare the properties of two elements"),
      topic("Chemical Bonding", "How electrostatic interactions and electron sharing or transfer produce molecular and ionic structures.", "a student connects a molecule's shape and polarity to its bonding and electron domains"),
      topic("Reactions", "How particles rearrange in reactions and how stoichiometry relates amounts of reactants and products.", "a lab group uses a balanced equation to predict product yield from measured reactants"),
      topic("Thermodynamics", "How energy changes and reaction rates describe the favorability and speed of chemical processes.", "a student uses temperature and concentration data to compare reaction rates"),
    ],
  },
  {
    subject: "AP Chinese Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand spoken and written Chinese using context and evidence.", "a student infers a speaker's purpose from a short announcement and its setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive Chinese conversation.", "a student asks a follow-up question and responds to a classmate's travel plans"),
      topic("Presentational Communication", "How speakers and writers organize Chinese to present information for a specific audience.", "a student records a clear response comparing two community activities"),
      topic("Culture and Connections", "How products, practices, and perspectives in Chinese-speaking communities connect to cultural context.", "a student explains how a festival practice reflects a community perspective"),
    ],
  },
  {
    subject: "AP Computer Science A",
    topics: [
      topic("Object-Oriented Programming", "How classes, objects, methods, and encapsulation organize Java programs.", "a programmer models a library item with fields and methods that protect its state"),
      topic("Data Structures", "How arrays and collections store related values and support access and traversal.", "a student selects a structure to store and process a sequence of scores"),
      topic("Algorithms", "How precise steps, selection, iteration, and method calls solve computational problems.", "a student traces a loop to determine how a list changes after each pass"),
      topic("Program Design", "How decomposition, testing, and reasoning about program behavior improve software solutions.", "a developer tests boundary cases after dividing a task into smaller methods"),
    ],
  },
  {
    subject: "AP Computer Science Principles",
    topics: [
      topic("Algorithms and Programming", "How algorithms use sequencing, selection, iteration, and abstraction to solve problems.", "a student traces a program that repeats until a condition is met"),
      topic("Data and Analysis", "How data is represented, collected, transformed, and analyzed to support conclusions.", "a team cleans a data set before comparing trends across categories"),
      topic("Networks and the Internet", "How protocols, addressing, and layered systems allow devices to exchange information.", "a student explains how packets travel through a network to reach a server"),
      topic("Computing Impacts", "How computing innovations affect people, communities, privacy, and society.", "a class evaluates who benefits and who may be harmed by a new data service"),
    ],
  },
  {
    subject: "AP Cybersecurity",
    topics: [
      topic("Threats and Risk", "How vulnerabilities, threats, likelihood, and impact inform cybersecurity risk decisions.", "an organization ranks a phishing vulnerability by its likelihood and potential harm"),
      topic("Cryptography and Authentication", "How encryption, hashing, and authentication protect information and verify identity.", "a service stores password hashes and checks a user's credentials at sign-in"),
      topic("Networks and Systems", "How network architecture, access controls, and system configuration affect security.", "an administrator segments a network to limit the spread of a compromised device"),
      topic("Privacy and Incident Response", "How privacy practices and incident response reduce harm and guide recovery after an event.", "a response team contains a breach, preserves evidence, and notifies affected users"),
    ],
  },
  {
    subject: "AP English Language and Composition",
    topics: [
      topic("Rhetorical Analysis", "How a writer's choices in purpose, audience, evidence, and style shape an argument's effect.", "a reader explains how a speaker's evidence and tone address a particular audience"),
      topic("Synthesis", "How writers evaluate and combine multiple sources to develop a supported position.", "a student groups source evidence by claim and cites it in a focused argument"),
      topic("Argument Writing", "How a defensible claim, reasoning, evidence, and qualification build an effective argument.", "a writer supports a claim with relevant evidence and addresses a counterargument"),
      topic("Language Use", "How diction, syntax, organization, and figurative choices create meaning and tone.", "a reader compares how two sentence structures emphasize different ideas"),
    ],
  },
  {
    subject: "AP English Literature and Composition",
    topics: [
      topic("Poetry Analysis", "How poetic form, imagery, sound, and structure contribute to a poem's meaning.", "a reader connects a repeated image and a shift in rhythm to a speaker's changing attitude"),
      topic("Prose Analysis", "How narration, characterization, setting, and structure shape a work of prose fiction.", "a student explains how a limited point of view affects what readers know"),
      topic("Literary Devices", "How choices such as metaphor, irony, and juxtaposition create effects within literature.", "a reader explains how an unexpected contrast develops a passage's tension"),
      topic("Thematic Analysis", "How patterns across a literary work develop a complex idea about human experience.", "a student traces how a character's repeated choices develop a central idea"),
    ],
  },
  {
    subject: "AP Environmental Science",
    topics: [
      topic("Ecosystems and Biodiversity", "How energy flow, nutrient cycles, populations, and biodiversity shape ecosystems.", "a student predicts how habitat loss changes species interactions in a food web"),
      topic("Natural Resources and Land Use", "How resource use and land-use decisions affect environmental systems and people.", "a planner compares the ecological effects of two land-use proposals"),
      topic("Energy and Pollution", "How energy choices and pollutants affect air, water, soil, and human health.", "a student traces a pollutant from its source through an ecosystem"),
      topic("Global Change and Sustainability", "How climate, population, and consumption changes shape long-term environmental outcomes.", "a researcher compares mitigation strategies using projected emissions data"),
    ],
  },
  {
    subject: "AP European History",
    topics: [
      topic("Renaissance and Reformation", "How Renaissance humanism and religious reform movements changed European culture and authority.", "a historian connects humanist education with changing ideas about religious authority"),
      topic("Absolutism and Revolution", "How states centralized power and how revolutions challenged existing political systems.", "a student compares a monarch's centralizing policy with a revolutionary response"),
      topic("Industrialization and Ideologies", "How industrial change reshaped work and society and encouraged new political ideologies.", "a researcher links factory labor conditions to debates about political reform"),
      topic("Conflict and Integration", "How European conflicts and cooperation reshaped borders, institutions, and identities.", "a student analyzes how a postwar agreement changed relations among states"),
    ],
  },
  {
    subject: "AP French Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand French texts using purpose, context, and evidence.", "a student infers an announcement's audience from its language and setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive French.", "a student asks for clarification and responds to a partner's plans"),
      topic("Presentational Communication", "How speakers and writers organize French for a clear presentation to an audience.", "a student records a structured comparison of two community traditions"),
      topic("Culture and Connections", "How products, practices, and perspectives in French-speaking communities connect to culture.", "a student explains how a public celebration reflects local values"),
    ],
  },
  {
    subject: "AP German Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand German texts using purpose, context, and evidence.", "a student infers an announcement's audience from its language and setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive German.", "a student asks for clarification and responds to a partner's plans"),
      topic("Presentational Communication", "How speakers and writers organize German for a clear presentation to an audience.", "a student records a structured comparison of two community traditions"),
      topic("Culture and Connections", "How products, practices, and perspectives in German-speaking communities connect to culture.", "a student explains how a public celebration reflects local values"),
    ],
  },
  {
    subject: "AP Human Geography",
    topics: [
      topic("Population and Migration", "How population patterns, demographic change, and migration shape places and societies.", "a geographer compares age structure and migration data for two regions"),
      topic("Culture and Political Geography", "How cultural patterns, identity, boundaries, and political power vary across space.", "a student maps how a language boundary relates to political decisions"),
      topic("Agriculture and Urbanization", "How food systems, land use, and urban growth transform human environments.", "a planner studies how a city's expansion changes nearby agricultural land"),
      topic("Development and Globalization", "How economic development and global connections create uneven outcomes among places.", "a researcher compares trade access and development indicators across regions"),
    ],
  },
  {
    subject: "AP Italian Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand Italian texts using purpose, context, and evidence.", "a student infers an announcement's audience from its language and setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive Italian.", "a student asks for clarification and responds to a partner's plans"),
      topic("Presentational Communication", "How speakers and writers organize Italian for a clear presentation to an audience.", "a student records a structured comparison of two community traditions"),
      topic("Culture and Connections", "How products, practices, and perspectives in Italian-speaking communities connect to culture.", "a student explains how a public celebration reflects local values"),
    ],
  },
  {
    subject: "AP Japanese Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand Japanese texts using purpose, context, and evidence.", "a student infers an announcement's audience from its language and setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive Japanese.", "a student asks for clarification and responds to a partner's plans"),
      topic("Presentational Communication", "How speakers and writers organize Japanese for a clear presentation to an audience.", "a student records a structured comparison of two community traditions"),
      topic("Culture and Connections", "How products, practices, and perspectives in Japanese-speaking communities connect to culture.", "a student explains how a public celebration reflects local values"),
    ],
  },
  {
    subject: "AP Latin",
    topics: [
      topic("Latin Grammar and Syntax", "How inflection, clause structure, and syntax determine relationships among words in Latin.", "a student uses case endings and verb forms to interpret a sentence"),
      topic("Caesar and Prose", "How Caesar's Latin prose uses narrative, syntax, and perspective to represent events.", "a reader analyzes how word order and narration shape an account of a campaign"),
      topic("Vergil and Epic Poetry", "How Vergil's language, meter, imagery, and allusion develop an epic's meanings.", "a student connects an image and a metrical choice to a scene's tone"),
      topic("Roman Culture and Context", "How Roman social, political, and religious contexts inform the interpretation of Latin texts.", "a student uses knowledge of Roman patronage to interpret a literary passage"),
    ],
  },
  {
    subject: "AP Macroeconomics",
    topics: [
      topic("Economic Indicators", "How output, unemployment, and price measures describe overall economic conditions.", "a student interprets a change in real GDP alongside unemployment data"),
      topic("Aggregate Models and Policy", "How aggregate demand, aggregate supply, and policy explain short-run economic outcomes.", "an analyst predicts the effect of a change in government spending on output"),
      topic("Money and Banking", "How money, financial institutions, and monetary policy affect interest rates and economic activity.", "a student traces how a central bank action can influence lending"),
      topic("Growth and International Trade", "How productivity, long-run growth, exchange rates, and trade connect economies.", "a student analyzes how a currency appreciation affects exports"),
    ],
  },
  {
    subject: "AP Microeconomics",
    topics: [
      topic("Scarcity and Consumer Choice", "How scarcity, opportunity cost, and marginal analysis guide individual choices.", "a student compares the marginal benefit and marginal cost of another unit"),
      topic("Supply, Demand, and Markets", "How supply, demand, and price changes coordinate decisions in competitive markets.", "a student predicts the effect of a substitute becoming more expensive"),
      topic("Production and Market Structures", "How firms choose inputs and output under different competitive conditions.", "a firm compares marginal revenue and marginal cost before changing output"),
      topic("Factor Markets and Market Failure", "How labor and other input markets work and how externalities can create inefficient outcomes.", "a city evaluates a pollution externality and a possible corrective policy"),
    ],
  },
  {
    subject: "AP Music Theory",
    topics: [
      topic("Notation and Aural Skills", "How musical notation and listening skills represent and identify pitch, rhythm, and sound.", "a student matches a notated rhythm to a heard musical pattern"),
      topic("Harmony and Chord Structure", "How chords, inversions, and harmonic progressions organize tonal music.", "a student identifies the function of a chord within a short progression"),
      topic("Voice Leading and Form", "How melodic lines move between harmonies and how formal patterns organize music.", "a student identifies a voice-leading error between two chords"),
      topic("Composition and Analysis", "How musical elements can be analyzed and applied when creating or completing music.", "a student completes a phrase using a coherent cadence and melodic contour"),
    ],
  },
  {
    subject: "AP Physics 1: Algebra-Based",
    topics: [
      topic("Kinematics", "How position, velocity, and acceleration describe motion and change over time.", "a student interprets a velocity-time graph for an object that changes direction"),
      topic("Forces", "How interactions and net force explain changes in an object's motion.", "a student draws a force diagram for a block pulled across a surface"),
      topic("Energy", "How energy is transferred and transformed, including through work and conservation.", "a student compares kinetic energy before and after a change in height"),
      topic("Waves", "How wave properties describe the transfer of energy and the behavior of periodic disturbances.", "a student predicts how changing wavelength affects a wave pattern"),
    ],
  },
  {
    subject: "AP Physics 2: Algebra-Based",
    topics: [
      topic("Fluid Mechanics", "How pressure, buoyancy, and fluid flow describe the behavior of liquids and gases.", "a student predicts how buoyant force changes when a submerged object displaces more fluid"),
      topic("Thermodynamics", "How heat, temperature, and energy transfer describe thermal systems.", "a student compares the energy transferred when two objects reach thermal equilibrium"),
      topic("Electrostatics", "How electric charge, electric fields, and potential describe stationary charge distributions.", "a student compares the field around two stationary point charges"),
      topic("Magnetism", "How magnetic fields exert forces and interact with moving charges and currents.", "a student predicts the direction of a force on a moving charge in a magnetic field"),
    ],
  },
  {
    subject: "AP Physics C: Electricity and Magnetism",
    topics: [
      topic("Electrostatics", "How charge distributions create electric fields and potential, analyzed with calculus when needed.", "a student integrates a charge distribution to find its electric field"),
      topic("Conductors and Capacitors", "How conductors and capacitors respond to electric fields and store electrical energy.", "a student predicts how stored energy changes when capacitor geometry changes"),
      topic("Electric Circuits", "How circuit laws and differential equations describe currents and changing circuit quantities.", "a student analyzes the transient response of a resistor-capacitor circuit"),
      topic("Magnetic Fields", "How currents create magnetic fields and how changing magnetic flux induces electromotive force.", "a student applies a field law to a current and predicts an induced emf"),
    ],
  },
  {
    subject: "AP Physics C: Mechanics",
    topics: [
      topic("Kinematics", "How derivatives and integrals connect position, velocity, and acceleration in motion.", "a student integrates a time-dependent acceleration to find displacement"),
      topic("Forces", "How Newton's laws and differential equations model motion under changing forces.", "a student sets up an equation of motion for an object on an incline"),
      topic("Energy", "How work-energy principles analyze mechanical systems and interactions.", "a student uses conservation principles to analyze a collision"),
      topic("Momentum", "How linear and angular momentum describe motion and interactions in mechanical systems.", "a student compares momentum before and after a collision"),
    ],
  },
  {
    subject: "AP Precalculus",
    topics: [
      topic("Polynomial and Rational Functions", "How polynomial and rational functions model patterns, including their zeros, end behavior, and asymptotes.", "a student compares a function's zeros and vertical asymptotes from its factors"),
      topic("Exponential and Logarithmic Functions", "How exponential and logarithmic functions model growth, decay, and inverse relationships.", "a student uses logarithms to solve for the time in a growth model"),
      topic("Trigonometric and Polar Functions", "How trigonometric and polar representations model periodic behavior and curves.", "a student models a seasonal pattern with a periodic function"),
      topic("Function Modeling", "How functions, transformations, and parameters represent relationships and changing quantities.", "a student chooses a model and interprets how a parameter changes its graph"),
    ],
  },
  {
    subject: "AP Psychology",
    topics: [
      topic("Biological Bases", "How brain systems, neural communication, genetics, and hormones relate to behavior.", "a researcher relates a change in neural signaling to a behavior"),
      topic("Sensation and Perception", "How sensory systems detect stimuli and how the brain organizes them into perceptions.", "a student distinguishes a physical stimulus from the perception of that stimulus"),
      topic("Learning", "How conditioning and observation shape behavior through experience.", "a researcher tests whether a behavior changed through reinforcement"),
      topic("Cognition", "How attention, memory, language, and problem solving shape mental processes.", "a student studies how retrieval cues affect recall"),
    ],
  },
  {
    subject: "AP Research",
    topics: [
      topic("Research Questions and Methods", "How a focused research question and suitable method guide a systematic investigation.", "a student narrows a broad interest into a question that can be investigated"),
      topic("Source Evaluation and Ethics", "How researchers assess source credibility and protect participants through ethical practice.", "a researcher checks source methods and obtains informed consent"),
      topic("Evidence and Analysis", "How evidence is organized and analyzed to support a defensible interpretation.", "a student codes observations and explains how the patterns answer a question"),
      topic("Academic Argument and Communication", "How researchers communicate a reasoned claim, limitations, and implications to an audience.", "a presenter explains what the findings support and what they cannot establish"),
    ],
  },
  {
    subject: "AP Seminar",
    topics: [
      topic("Research Questions and Perspectives", "How inquiry questions and multiple perspectives frame a complex issue.", "a student compares how two disciplines define the same public issue"),
      topic("Source Evaluation and Evidence", "How credible sources and relevant evidence support claims in an investigation.", "a student checks a source's methods before using its findings as evidence"),
      topic("Argument and Synthesis", "How reasoning connects evidence from multiple sources into a coherent argument.", "a writer synthesizes sources that agree and disagree about a claim"),
      topic("Presentation and Reflection", "How oral communication and reflection make research reasoning clear to an audience.", "a presenter answers a challenge by explaining the evidence behind a choice"),
    ],
  },
  {
    subject: "AP Spanish Language and Culture",
    topics: [
      topic("Interpretive Communication", "How listeners and readers understand Spanish texts using purpose, context, and evidence.", "a student infers an announcement's audience from its language and setting"),
      topic("Interpersonal Communication", "How speakers exchange information and respond appropriately in interactive Spanish.", "a student asks for clarification and responds to a partner's plans"),
      topic("Presentational Communication", "How speakers and writers organize Spanish for a clear presentation to an audience.", "a student records a structured comparison of two community traditions"),
      topic("Culture and Connections", "How products, practices, and perspectives in Spanish-speaking communities connect to culture.", "a student explains how a public celebration reflects local values"),
    ],
  },
  {
    subject: "AP Spanish Literature and Culture",
    topics: [
      topic("Literary Forms and Techniques", "How literary forms, narration, imagery, and language shape Spanish-language works.", "a student connects a narrator's choices to the way readers receive a story"),
      topic("Thematic Analysis", "How recurring conflicts and motifs develop themes across Spanish-language literature.", "a reader traces how a recurring image develops a work's central idea"),
      topic("Historical and Cultural Context", "How historical and cultural contexts inform the interpretation of literary works.", "a student uses a work's setting and period to interpret a character's choices"),
      topic("Comparative Interpretation", "How comparison among works reveals meaningful similarities and differences in literary choices.", "a student compares how two authors portray memory and identity"),
    ],
  },
  {
    subject: "AP Statistics",
    topics: [
      topic("Probability", "How probability models describe chance and support reasoning about uncertain outcomes.", "a student calculates the chance of an outcome using a probability model"),
      topic("Sampling", "How samples are selected and how sampling methods affect conclusions about a population.", "a researcher evaluates whether a sample represents the population of interest"),
      topic("Inference", "How sample data support estimates and tests about a population parameter.", "a student interprets a confidence interval in the context of a study"),
      topic("Regression", "How regression models describe relationships between quantitative variables and support predictions.", "a student interprets a residual plot before using a linear model"),
    ],
  },
  {
    subject: "AP United States Government and Politics",
    topics: [
      topic("Constitutional Principles", "How constitutional ideas, federalism, and civil liberties structure U.S. government.", "a student analyzes a dispute about the division of state and federal power"),
      topic("Political Institutions", "How Congress, the presidency, the courts, and the bureaucracy make and implement policy.", "a student traces how a bill can be affected by multiple institutions"),
      topic("Civil Rights", "How civil rights and civil liberties shape the relationship between individuals and U.S. government.", "a researcher studies how a voting rule affects political participation"),
      topic("Public Policy", "How public opinion, political behavior, and competing interests influence public policy.", "a student relates survey results to a policy debate"),
    ],
  },
  {
    subject: "AP United States History",
    topics: [
      topic("Colonial Period", "How colonization, imperial policies, and local societies shaped life in Britain's North American colonies.", "a historian connects colonial protest to a change in imperial policy"),
      topic("Revolutionary Era", "How revolutionary ideas and conflicts led the colonies to independence and a new political system.", "a student links a political pamphlet to colonial arguments for independence"),
      topic("Civil War", "How slavery, sectional conflict, and war reshaped the United States and the meaning of the Union.", "a researcher connects a wartime decision to changing political aims"),
      topic("Modern America", "How the United States changed through twentieth-century conflicts, reform, and global influence.", "a student analyzes how a wartime decision affected life on the home front"),
    ],
  },
  {
    subject: "AP World History: Modern",
    topics: [
      topic("The Global Tapestry", "How states and societies developed distinct political, social, and cultural systems after 1200.", "a student compares how two states organized political authority"),
      topic("Networks of Exchange", "How trade and migration networks moved goods, people, technologies, and ideas across regions.", "a historian traces how a trade route spread a technology"),
      topic("Land-Based and Maritime Empires", "How empires expanded and governed territories through military, administrative, and cultural strategies.", "a student compares how two empires managed diverse populations"),
      topic("Globalization", "How industrialization and modern global connections changed economies, societies, and migration.", "a researcher links industrial production to new global migration patterns"),
    ],
  },
  {
    subject: "AP Comparative Government and Politics",
    topics: [
      topic("Political Systems and Regimes", "How institutions and regime types distribute authority and shape political participation.", "a student compares how two governments select national leaders"),
      topic("Political Institutions", "How executives, legislatures, courts, and bureaucracies operate within different political systems.", "a researcher compares the legislative powers of two countries"),
      topic("Citizens, Society, and Political Culture", "How social cleavages, political culture, and citizen participation influence government.", "a student relates a participation pattern to a country's social divisions"),
      topic("Public Policy and Political Change", "How policy choices and political change reflect institutions, interests, and economic conditions.", "a student compares how two states respond to an economic challenge"),
    ],
  },
];

const SAT_SUBJECTS = [
  {
    subject: "Math",
    topics: [
      topic("Algebra", "How linear equations, inequalities, and systems represent relationships between quantities.", "a student builds a pair of linear equations from a comparison of two plans"),
      topic("Advanced Math", "How nonlinear expressions, equations, and functions represent more complex relationships.", "a student interprets the roots and features of a quadratic model"),
      topic("Problem-Solving and Data Analysis", "How ratios, rates, percentages, probability, and data summaries answer quantitative questions.", "a student estimates a population proportion from a sample and explains its limits"),
      topic("Geometry and Trigonometry", "How geometric relationships, measurement, and trigonometric ratios solve problems about shape and space.", "a student uses a right-triangle ratio to find a missing side"),
      topic("Functions", "How functions map inputs to outputs and how their representations describe relationships.", "a student compares a function's equation, table, and graph"),
    ],
  },
  {
    subject: "Reading and Writing",
    topics: [
      topic("Information and Ideas", "How readers locate central ideas, interpret details, and draw supported inferences from a text.", "a reader uses two details to infer a speaker's unstated concern"),
      topic("Craft and Structure", "How word choice, structure, point of view, and relationships between texts shape meaning.", "a student explains how a passage's organization changes its emphasis"),
      topic("Expression of Ideas", "How writers develop claims and use transitions to make ideas clear and logically connected.", "a student chooses a transition that makes the relationship between two claims clear"),
      topic("Standard English Conventions", "How grammar, usage, and punctuation create clear, standard written sentences.", "a student edits a sentence so its subject and verb agree"),
    ],
  },
];

const ACT_SUBJECTS = [
  {
    subject: "Reading",
    topics: [
      topic("Reading Comprehension", "How readers understand claims, details, structure, and relationships in a passage.", "a student compares two paragraphs to identify how the second develops the first"),
      topic("Vocabulary", "How context and word relationships clarify the meaning of unfamiliar terms.", "a reader uses nearby clues to infer the meaning of a word"),
      topic("Main Ideas", "How readers identify a passage's central point and distinguish it from supporting details.", "a student summarizes the passage without relying on a minor example"),
      topic("Inferences", "How evidence in a passage supports a conclusion that is not stated directly.", "a reader combines two details to infer a character's motive"),
    ],
  },
  {
    subject: "English",
    topics: [
      topic("Grammar", "How sentence structure and standard grammatical relationships make writing clear.", "a student revises a sentence so a modifier clearly describes the intended noun"),
      topic("Punctuation", "How punctuation marks clarify boundaries and relationships between ideas.", "a student chooses punctuation that correctly joins two independent clauses"),
      topic("Style", "How diction, concision, and sentence flow fit a writer's purpose and audience.", "an editor removes an unnecessary phrase while preserving the intended meaning"),
      topic("Strategy", "How organization and rhetorical choices help a passage achieve its purpose.", "a reader selects the sentence that best supports the paragraph's focus"),
    ],
  },
  {
    subject: "Science (Optional)",
    topics: [
      topic("Data Analysis", "How tables, graphs, and experimental results support conclusions from scientific data.", "a student compares two plotted trends and identifies the supported conclusion"),
      topic("Scientific Reasoning", "How evidence, variables, and controls support or limit a scientific claim.", "a student identifies which variable was changed in an experiment"),
      topic("Research Summaries", "How a study's design, results, and limitations are summarized and interpreted.", "a reader identifies which result directly addresses the research question"),
    ],
  },
];

export const TEST_SUBJECTS = {
  SAT: SAT_SUBJECTS.map(({ subject }) => subject),
  ACT: ["Math", "Reading", "English", "Science (Optional)"],
  "AP Exams": AP_COURSES.map(({ subject }) => subject),
};

export const TOPIC_CATALOG = Object.fromEntries(
  [...AP_COURSES, ...SAT_SUBJECTS, ...ACT_SUBJECTS].map(({ subject, topics }) => [subject, topics])
);

export const TOPIC_OPTIONS = Object.fromEntries(
  Object.entries(TOPIC_CATALOG).map(([subject, topics]) => [subject, topics.map(({ name }) => name)])
);

export const SUPPORTED_FALLBACK_TESTS = new Set(["SAT", "AP Exams"]);

export function getTopicDetails(subject, topicName) {
  return TOPIC_CATALOG[subject]?.find(({ name }) => name === topicName) || null;
}
