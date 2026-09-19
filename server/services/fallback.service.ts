import { RecoveryProfile, BatchComponent, UnresolvedFraction, RecoveryDecision } from '../../src/types/recyclens.types.ts';

const FALLBACK_ENGINE_LABEL = 'Demo fallback mode — visual AI unavailable';

export class FallbackService {
  /**
   * Generates an honest, deterministic Recovery Profile based on preset selection or heuristic hint
   * NOTE: This is a deterministic demo fallback and does NOT run local computer vision.
   */
  public generateFallbackProfile(
    materialHint?: string,
    presetId?: string
  ): Omit<RecoveryProfile, 'id' | 'scan_id' | 'timestamp'> {
    // 1. Check if matching cardboard
    if (presetId === 'preset-cardboard-pizza' || materialHint?.toLowerCase().includes('cardboard') || materialHint?.toLowerCase().includes('paper')) {
      const composition: BatchComponent[] = [
        {
          material: 'Corrugated Kraft Linerboard',
          material_code: 'PAPER_CARDBOARD',
          category: 'PAPER',
          estimated_share_percent: 72.0,
          confidence: 90.0,
          polymer_subtype: 'Cellulose Kraft Pulp',
          visual_evidence: [
            'Parallel fluted inner corrugation layer visible along carton edge cut',
            'Unbleached brown kraft paper fibrous surface texture',
          ],
          contamination_percent: 22.0,
          recoverability_score: 75.0,
          recoverability_grade: 'GRADE_B',
          is_separable: false,
          preparation_actions: ['Segregate oil-soaked bottom flaps from clean top carton sections'],
          uncertainty: ['Moisture content cannot be determined visually'],
        },
        {
          material: 'Grease-Soaked Food Takeout Paper',
          material_code: 'PAPER_MIXED',
          category: 'PAPER',
          estimated_share_percent: 15.0,
          confidence: 85.0,
          polymer_subtype: 'Food Contact Cellulose Board',
          visual_evidence: ['Translucent dark oil stains and organic grease saturation on base fluting'],
          contamination_percent: 45.0,
          recoverability_score: 40.0,
          recoverability_grade: 'GRADE_C',
          is_separable: true,
          preparation_actions: ['Cut away and divert heavily grease-stained sections to composting'],
          uncertainty: ['Depth of lipid penetration into inner corrugation unconfirmed'],
        },
        {
          material: 'BOPP Synthetic Adhesive Tape',
          material_code: 'PLASTIC_PP',
          category: 'PLASTIC',
          estimated_share_percent: 8.0,
          confidence: 88.0,
          polymer_subtype: 'Biaxially Oriented Polypropylene Film',
          visual_evidence: ['High-gloss plastic adhesive tape adhered across top carton seams'],
          contamination_percent: 10.0,
          recoverability_score: 60.0,
          recoverability_grade: 'GRADE_C',
          is_separable: true,
          preparation_actions: ['Peel and pull off synthetic shipping tape strips manually'],
          uncertainty: ['Rubber-based vs acrylic adhesive chemistry cannot be verified visually'],
        },
      ];

      const unresolvedFraction: UnresolvedFraction = {
        estimated_share_percent: 5.0,
        visual_reason: 'Inner corrugated corner crevices obscured in photographic shadow.',
      };

      const recoveryDecision: RecoveryDecision = {
        batch_archetype: 'Post-Consumer Packaging with Food Contamination',
        condition_summary: 'Moderate visible oil penetration (~26%). ~5% obscured inner fluting.',
        recommended_action: 'Cut and discard grease-soaked bottom flutes; peel BOPP tape prior to hydrapulping.',
        economic_effect: 'Yield deduction applied for oil saturation; clean top sections qualify for Grade-A kraft pulp benchmark.',
        routing_strategy: 'SINGLE_FACILITY',
        routing_rationale: 'Paper re-pulper accepts OCC if heavily grease-soaked sections are segregated.',
      };

      return {
        primary_material: {
          code: 'PAPER_CARDBOARD',
          name: 'Corrugated Cardboard (OCC Kraft Packaging)',
          category: 'PAPER',
          confidence: 88.0,
          polymer_subtype: 'Cellulose Kraft Linerboard',
        },
        composition,
        unresolved_fraction: unresolvedFraction,
        recovery_decision: recoveryDecision,
        visual_evidence: [
          'Parallel fluted inner corrugation layer visible along cut edges',
          'Brown unbleached kraft paper surface texture observed',
          'Rectangular structural fold creases characteristic of shipping packaging',
        ],
        secondary_materials: [
          { name: 'Printed plastic adhesive tape', percentage: 7.5, separable: true, notes: 'Peel plastic tape before hydrapulping' },
          { name: 'Thermal Paper Delivery Label', percentage: 3.0, separable: false, notes: 'Minor contaminant in de-inking' },
        ],
        contamination: {
          percentage: 26.0,
          type: 'FOOD_OIL_AND_ORGANIC_GREASE',
          severity: 'MODERATE',
          explanation: 'Notable oil penetration and food residue on lower corrugated flutes reducing fiber yield.',
          visual_indicators: ['Translucent grease discoloration', 'Surface food residue', 'Non-cellulose tape borders'],
        },
        contamination_evidence: [
          'Translucent dark grease saturation on lower corrugated panels',
          'Non-pulpable synthetic plastic packing tape adhered along carton seams',
          'Residual thermal adhesive courier slip attached to top flap',
        ],
        recoverability: {
          score: 72.0,
          grade: 'GRADE_B',
          is_commercially_viable: true,
          actionable_advice: 'Cut away heavily grease-stained bottom sections to retain Grade-A pricing on clean top flaps.',
          potential_applications: ['Recycled testliner', 'Molded egg trays', 'Secondary packaging cores'],
        },
        uncertainty: [
          'Internal fiber moisture content cannot be measured visually',
          'Depth of oil penetration into inner flutes requires physical pulping verification',
          'Exact batch weight requires physical weighbridge verification',
        ],
        recommended_preparation: [
          'Cut away and discard oil-soaked bottom cardboard panels',
          'Peel and remove plastic shipping tape strips manually',
          'Keep dry cardboard bales protected from atmospheric rain moisture',
        ],
        visual_explanation: 'Simulated profile for industrial corrugated shipping carton mixed with takeout packaging. Food grease lowers pulp recovery efficiency by ~25%.',
        model_name: FALLBACK_ENGINE_LABEL,
        is_fallback_inference: true,
      };
    }

    // 2. Check if aluminum cans
    if (presetId === 'preset-alu-cans' || materialHint?.toLowerCase().includes('alu') || materialHint?.toLowerCase().includes('can') || materialHint?.toLowerCase().includes('metal')) {
      const composition: BatchComponent[] = [
        {
          material: 'Wrought Aluminium Can Bodies (Alloy 3004)',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL',
          estimated_share_percent: 88.0,
          confidence: 95.0,
          polymer_subtype: 'Alloy 3004 Draw & Ironed Body',
          visual_evidence: [
            'Reflective metallic surface fractures and beverage can stay-on tabs visible',
            'Cylindrical draw-and-ironed body geometry with concave base domes',
          ],
          contamination_percent: 3.0,
          recoverability_score: 97.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Bale or crush cans to minimize shipping freight volume'],
          uncertainty: ['Alloying composition assumed standard beverage specification'],
        },
        {
          material: 'Aluminium Can End Lids & Stay-On Tabs (Alloy 5182)',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL',
          estimated_share_percent: 10.0,
          confidence: 93.0,
          polymer_subtype: 'Alloy 5182 High-Magnesium Lid',
          visual_evidence: ['Scored pull-tab opening mechanism with stay-on rivet'],
          contamination_percent: 2.0,
          recoverability_score: 96.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Maintain attached to cans during compression'],
          uncertainty: ['Exact magnesium percentage requires chemical spectrometry'],
        },
      ];

      const unresolvedFraction: UnresolvedFraction = {
        estimated_share_percent: 2.0,
        visual_reason: 'Interior cavities of deformed cans not fully illuminated from top angle.',
      };

      const recoveryDecision: RecoveryDecision = {
        batch_archetype: 'Wrought Aluminium Beverage UBC Scrap',
        condition_summary: 'Clean condition (<5% ink coating). Negligible moisture pooling.',
        recommended_action: 'Bale or compress cans to optimize payload volume for secondary remelter.',
        economic_effect: 'Near-zero contamination deduction; qualifies for maximum regional ingot benchmark.',
        routing_strategy: 'SINGLE_FACILITY',
        routing_rationale: 'Homogeneous high-purity non-ferrous stream accepted by specialized secondary aluminium smelters.',
      };

      return {
        primary_material: {
          code: 'METAL_ALUMINIUM',
          name: 'Aluminium UBC Beverage Cans (Standard Wrought UBC Archetype)',
          category: 'METAL',
          confidence: 94.0,
          polymer_subtype: 'Wrought Aluminium UBC',
        },
        composition,
        unresolved_fraction: unresolvedFraction,
        recovery_decision: recoveryDecision,
        visual_evidence: [
          'Reflective metallic surface fractures and beverage can stay-on tabs visible',
          'Cylindrical draw-and-ironed body geometry with concave base domes',
          'Printed exterior brand lithography on deformed thin-gauge metal wall',
        ],
        secondary_materials: [
          { name: 'Exterior Polymer Varnish / Printing Ink', percentage: 2.5, separable: false, notes: 'Burned off during dross de-coating' },
        ],
        contamination: {
          percentage: 4.0,
          type: 'SURFACE_DUST',
          severity: 'CLEAN',
          explanation: 'Dry, crushed metallic cans with negligible liquid pooling and high metallurgical purity.',
          visual_indicators: ['Reflective metallic fractures', 'Standard 330ml/500ml beverage silhouettes', 'Clean interior cavities'],
        },
        contamination_evidence: [
          'Minor surface road dust on exterior metallic folds',
          'Dry interior cavity with no visible pooling liquids',
        ],
        recoverability: {
          score: 96.0,
          grade: 'GRADE_A',
          is_commercially_viable: true,
          actionable_advice: 'Keep compressed and free of sand/stones. Direct intake payout offered by secondary smelters.',
          potential_applications: ['Closed-loop can-to-can remelting', 'Automotive die-casting ingots', 'Deoxidizing agents'],
        },
        uncertainty: [
          'Specific alloying element ratio (Alloy 3004 body vs 5182 lid) is estimated based on UBC standards',
          'Total batch weighment must be confirmed on certified industrial platform scales',
        ],
        recommended_preparation: [
          'Bale or crush cans to minimize shipping freight volume',
          'Ensure batch remains free of iron/steel magnetic contaminants',
          'Verify no closed unpunctured aerosol or pressurized containers are included',
        ],
        visual_explanation: 'Simulated profile for crushed post-consumer aluminium beverage cans in dry condition with 96% recoverability.',
        model_name: FALLBACK_ENGINE_LABEL,
        is_fallback_inference: true,
      };
    }

    // 3. Check if E-Waste
    if (presetId === 'preset-ewaste-pcb' || materialHint?.toLowerCase().includes('ewaste') || materialHint?.toLowerCase().includes('pcb') || materialHint?.toLowerCase().includes('board')) {
      const composition: BatchComponent[] = [
        {
          material: 'Populated FR4 Circuit Boards with SMD Chips',
          material_code: 'EWASTE_PCB',
          category: 'EWASTE',
          estimated_share_percent: 70.0,
          confidence: 92.0,
          polymer_subtype: 'FR4 Glass-Epoxy Laminate',
          visual_evidence: [
            'Green soldermask printed circuit board substrate with multi-layer copper traces',
            'Surface-mount IC chips, gold-flashed edge contacts, and through-hole capacitors',
          ],
          contamination_percent: 12.0,
          recoverability_score: 90.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Store in anti-static bins to avoid component shear during transit'],
          uncertainty: ['Precious metal assay (ppm Au/Ag/Pd) requires chemical assay'],
        },
        {
          material: 'Extruded Aluminium Heat Sink Blocks',
          material_code: 'METAL_ALUMINIUM',
          category: 'METAL',
          estimated_share_percent: 15.0,
          confidence: 94.0,
          polymer_subtype: 'Extruded Alloy 6063 Heat Sink',
          visual_evidence: ['Silver finned extruded aluminium cooling block with spring clip retention'],
          contamination_percent: 5.0,
          recoverability_score: 95.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Unscrew heat sink retaining clips and segregate into non-ferrous metal stream'],
          uncertainty: ['Thermal grease residue on contact base'],
        },
        {
          material: 'Insulated Copper Toroid Windings',
          material_code: 'METAL_STEEL', // or metal non-ferrous
          category: 'METAL',
          estimated_share_percent: 10.0,
          confidence: 88.0,
          polymer_subtype: 'Enamelled Magnet Wire',
          visual_evidence: ['Circular ferrite cores wound with dense copper enamel magnet wire'],
          contamination_percent: 6.0,
          recoverability_score: 92.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Snip leads with wire cutters to isolate secondary copper fraction'],
          uncertainty: ['Core material magnetic permeability unverified'],
        },
      ];

      const unresolvedFraction: UnresolvedFraction = {
        estimated_share_percent: 5.0,
        visual_reason: 'Chassis standoff mounting brackets and obscured board underside.',
      };

      const recoveryDecision: RecoveryDecision = {
        batch_archetype: 'Multi-Material Electronic Waste (FR4 PCB + Heat Sinks + Coils)',
        condition_summary: 'Low surface dust contamination (~15%). 5% underside obscured.',
        recommended_action: 'Unscrew and segregate large aluminium heat sinks; clip off high-grade copper coils prior to hydrometallurgical refining.',
        economic_effect: 'Split segregation enables capturing dedicated aluminium and copper scrap premiums in addition to precious metal refining value.',
        routing_strategy: 'SPLIT_ROUTING',
        routing_rationale: 'Multi-material composition contains distinct non-ferrous and electronic fractions requiring split routing.',
      };

      return {
        primary_material: {
          code: 'EWASTE_PCB',
          name: 'Populated Printed Circuit Boards (FR4 Grade)',
          category: 'EWASTE',
          confidence: 92.0,
          polymer_subtype: 'FR4 Epoxy-Glass + Cu/Au Metallurgy',
        },
        composition,
        unresolved_fraction: unresolvedFraction,
        recovery_decision: recoveryDecision,
        visual_evidence: [
          'Green soldermask printed circuit board substrate with multi-layer copper traces',
          'Surface-mount IC chips, gold-flashed edge contacts, and through-hole capacitors',
          'Extruded aluminium heat sink blocks fastened with spring clips',
        ],
        secondary_materials: [
          { name: 'Aluminium Heat Sinks', percentage: 14.0, separable: true, notes: 'Unscrew before shredding' },
          { name: 'Copper Inductor Coils', percentage: 8.5, separable: true, notes: 'High value secondary copper' },
        ],
        contamination: {
          percentage: 15.0,
          type: 'DUST_AND_CHASSIS_PLASTIC',
          severity: 'LOW',
          explanation: 'Complete circuit boards with attached connectors and minimal atmospheric corrosion.',
          visual_indicators: ['Solder points', 'SMD integrated circuits', 'Gold-plated PCIe edge connectors'],
        },
        contamination_evidence: [
          'Atmospheric dust accumulation between dense surface mount components',
          'Residual plastic mounting standoff brackets attached to corner drillings',
        ],
        recoverability: {
          score: 89.0,
          grade: 'GRADE_A',
          is_commercially_viable: true,
          actionable_advice: 'Dismantle large aluminum heat sinks and batteries before shipping to certified e-waste refiner.',
          potential_applications: ['Hydrometallurgical Au/Ag/Cu recovery', 'Precious metal refining', 'Fiberglass aggregate'],
        },
        uncertainty: [
          'Exact precious metal assay (ppm Au/Pd/Ag) requires laboratory spectrometry',
          'Presence of leaded solder (Sn-Pb) vs RoHS compliant alloy unconfirmed by photo',
          'Batch weight requires precision industrial scales',
        ],
        recommended_preparation: [
          'Remove easily detachable aluminum heat sink brackets and steel shields',
          'Remove coin-cell backup batteries prior to shredder intake',
          'Pack in anti-static containers to prevent component shear during logistics',
        ],
        visual_explanation: 'Simulated profile for computer circuit boards with visible precious metal connectors and intact IC components.',
        model_name: FALLBACK_ENGINE_LABEL,
        is_fallback_inference: true,
      };
    }

    // 4. Check if HDPE
    if (presetId === 'preset-hdpe-containers' || materialHint?.toLowerCase().includes('hdpe')) {
      const composition: BatchComponent[] = [
        {
          material: 'Rigid HDPE Blow-Molded Container Bodies',
          material_code: 'PLASTIC_HDPE',
          category: 'PLASTIC',
          estimated_share_percent: 86.0,
          confidence: 92.0,
          polymer_subtype: 'HDPE Rigid Blow Molding (Type 2)',
          visual_evidence: [
            'Semi-opaque blow-molded plastic container with integral handle geometry',
            'Continuous bottom parting weld line characteristic of extrusion blow molding',
          ],
          contamination_percent: 8.0,
          recoverability_score: 93.0,
          recoverability_grade: 'GRADE_A',
          is_separable: false,
          preparation_actions: ['Rinse and invert bottles to drain residual liquid soap completely'],
          uncertainty: ['Melt flow index (MFI) unconfirmed by visual appearance'],
        },
        {
          material: 'Injection Molded Polypropylene Closures',
          material_code: 'PLASTIC_PP',
          category: 'PLASTIC',
          estimated_share_percent: 8.0,
          confidence: 89.0,
          polymer_subtype: 'Polypropylene Injection Molded (Type 5)',
          visual_evidence: ['Pigmented colored closure caps screwed onto container neck threads'],
          contamination_percent: 5.0,
          recoverability_score: 88.0,
          recoverability_grade: 'GRADE_A',
          is_separable: true,
          preparation_actions: ['Unscrew colored PP caps to preserve unpigmented HDPE flake purity'],
          uncertainty: ['Presence of liner seal wad inside cap unverified'],
        },
        {
          material: 'Paper & Vinyl Adhesive Labels',
          material_code: 'OTHER',
          category: 'OTHER',
          estimated_share_percent: 6.0,
          confidence: 85.0,
          polymer_subtype: 'Paper Adhesive Label',
          visual_evidence: ['Printed paper and film label adhered with hot-melt glue to sidewalls'],
          contamination_percent: 15.0,
          recoverability_score: 65.0,
          recoverability_grade: 'GRADE_B',
          is_separable: true,
          preparation_actions: ['Washed out during standard alkaline wash process at reclaimer'],
          uncertainty: ['Glue formulation requires caustic tank dissolution'],
        },
      ];

      const recoveryDecision: RecoveryDecision = {
        batch_archetype: 'Rigid HDPE Container Batch with Closures',
        condition_summary: 'Low soap residue contamination (~9%). High polymer rigidity.',
        recommended_action: 'Rinse bottles and detach colored PP caps to preserve unpigmented HDPE flake premium.',
        economic_effect: 'High clean benchmark realization with minor deduction for paper label wash-off.',
        routing_strategy: 'SINGLE_FACILITY',
        routing_rationale: 'Mechanical wash and float-sink reclaimer processes rigid polyolefins directly.',
      };

      return {
        primary_material: {
          code: 'PLASTIC_HDPE',
          name: 'High-Density Polyethylene (HDPE Blow Molded)',
          category: 'PLASTIC',
          confidence: 90.0,
          polymer_subtype: 'HDPE Rigid (Type 2)',
        },
        composition,
        recovery_decision: recoveryDecision,
        visual_evidence: [
          'Semi-opaque blow-molded plastic container with integral handle geometry',
          'Continuous bottom parting weld line characteristic of extrusion blow molding',
          'Rigid unpigmented / white polyethylene sidewall structure',
        ],
        secondary_materials: [
          { name: 'Paper & Vinyl Adhesive Labels', percentage: 6.0, separable: true, notes: 'Washed out during caustic flotation' },
          { name: 'Polypropylene Caps', percentage: 4.0, separable: true, notes: 'Easily sorted by density tank' },
        ],
        contamination: {
          percentage: 9.0,
          type: 'DETERGENT_RESIDUE',
          severity: 'LOW',
          explanation: 'Rinsed rigid plastic bottles with minor paper label remnants.',
          visual_indicators: ['Opaque bottle geometry', 'Blow-mold bottom pinch-off line', 'Rigid handle neck'],
        },
        contamination_evidence: [
          'Surface paper label residue with adhesive glue line',
          'Minor internal soap/detergent foam droplets visible in neck',
        ],
        recoverability: {
          score: 92.0,
          grade: 'GRADE_A',
          is_commercially_viable: true,
          actionable_advice: 'Empty liquid residue completely to avoid deductions during moisture weighment checks.',
          potential_applications: ['Extruded irrigation pipes', 'Industrial pallets', 'Detergent packaging blends'],
        },
        uncertainty: [
          'Exact polymer melt flow index (MFI) unconfirmed by visual appearance',
          'Presence of multi-layer EVOH barrier layer cannot be verified from exterior photo',
          'Final settlement rate depends on dock inspection',
        ],
        recommended_preparation: [
          'Rinse and invert bottles to drain residual liquid contents completely',
          'Remove colored polypropylene closure caps to preserve unpigmented resin grade',
          'Compress or perforate jugs to optimize payload volume',
        ],
        visual_explanation: 'Simulated profile for rigid HDPE containers suitable for mechanical pelletizing and extrusion.',
        model_name: FALLBACK_ENGINE_LABEL,
        is_fallback_inference: true,
      };
    }

    // Default: PET Bottles
    const defaultComposition: BatchComponent[] = [
      {
        material: 'Transparent PET Bottle Bodies',
        material_code: 'PLASTIC_PET',
        category: 'PLASTIC',
        estimated_share_percent: 82.0,
        confidence: 93.0,
        polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
        visual_evidence: [
          'Transparent bottle bodies with injection blow-molded neck finish and base petaloid shape',
          'High optical clarity with light refraction characteristic of transparent PET',
        ],
        contamination_percent: 10.0,
        recoverability_score: 92.0,
        recoverability_grade: 'GRADE_A',
        is_separable: false,
        preparation_actions: ['Flatten bottle bodies to reduce transit volume by ~60%'],
        uncertainty: ['Intrinsic viscosity cannot be confirmed without laboratory testing'],
      },
      {
        material: 'Colored Polypropylene Closure Caps',
        material_code: 'PLASTIC_PP',
        category: 'PLASTIC',
        estimated_share_percent: 11.0,
        confidence: 90.0,
        polymer_subtype: 'Polypropylene Injection Molded (Type 5)',
        visual_evidence: ['Colored opaque threaded closure caps fastened to bottle necks'],
        contamination_percent: 5.0,
        recoverability_score: 86.0,
        recoverability_grade: 'GRADE_A',
        is_separable: true,
        preparation_actions: ['Unscrew and segregate colored caps to earn clean flake premium'],
        uncertainty: ['Pigment chemistry unconfirmed visually'],
      },
      {
        material: 'Printed Oriented Polystyrene Label Wrappers',
        material_code: 'OTHER',
        category: 'OTHER',
        estimated_share_percent: 4.0,
        confidence: 84.0,
        polymer_subtype: 'OPS / PVC Shrink Sleeve',
        visual_evidence: ['Thin flexible printed promotional sleeve film wrapped around bottle midsection'],
        contamination_percent: 15.0,
        recoverability_score: 55.0,
        recoverability_grade: 'GRADE_C',
        is_separable: true,
        preparation_actions: ['Cut or perforate shrink sleeves to peel away prior to shredding'],
        uncertainty: ['Adhesive vs shrink application unconfirmed'],
      },
    ];

    const defaultUnresolved: UnresolvedFraction = {
      estimated_share_percent: 3.0,
      visual_reason: 'Interior base petaloids partially obscured by beverage condensation droplets.',
    };

    const defaultDecision: RecoveryDecision = {
      batch_archetype: 'Post-Consumer PET Packaging with Closures',
      condition_summary: 'Low visible droplet contamination (~12%). ~3% obscured base fluting.',
      recommended_action: 'Unscrew and segregate colored caps; perforate and flatten bottles to minimize transit volume.',
      economic_effect: 'Clean PET bottles achieve prime bottle-to-bottle benchmark; cap removal avoids dock sorting penalty.',
      routing_strategy: 'SINGLE_FACILITY',
      routing_rationale: 'Single-stream mechanical reclaimer accepts PET batch with standard sink-float cap separation.',
    };

    return {
      primary_material: {
        code: 'PLASTIC_PET',
        name: 'Polyethylene Terephthalate (PET Bottles)',
        category: 'PLASTIC',
        confidence: 90.0,
        polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
      },
      composition: defaultComposition,
      unresolved_fraction: defaultUnresolved,
      recovery_decision: defaultDecision,
      visual_evidence: [
        'Transparent bottle bodies with injection blow-molded neck finish and base petaloid shape',
        'High optical clarity with light refraction characteristic of transparent PET',
        'Colored polypropylene threaded closure caps attached to container necks',
      ],
      secondary_materials: [
        { name: 'HDPE Screw Caps & Tamper Rings', percentage: 8.0, separable: true, notes: 'Separated via sink-float wash tank' },
        { name: 'Printed Plastic Label Sleeves', percentage: 4.5, separable: true, notes: 'Removed via label scrapers' },
      ],
      contamination: {
        percentage: 12.0,
        type: 'BEVERAGE_DROPLETS_AND_DUST',
        severity: 'LOW',
        explanation: 'Post-consumer transparent beverage bottles with minor inner droplet residue and attached colored caps.',
        visual_indicators: ['Transparent polymer refractive index', 'Standard neck threads', 'Light liquid traces'],
      },
      contamination_evidence: [
        'Attached colored polypropylene screw caps and tamper rings',
        'Printed outer plastic wrapper sleeve adhered to mid-body',
        'Minor beverage droplet condensation visible on interior bottle walls',
      ],
      recoverability: {
        score: 88.0,
        grade: 'GRADE_A',
        is_commercially_viable: true,
        actionable_advice: 'Flatten bottles to save 60% transport volume. Remove caps if seeking maximum per-kg premium.',
        potential_applications: ['Bottle-to-bottle rPET food grade', 'Polyester staple fiber spinning', 'Thermoforming sheets'],
      },
      uncertainty: [
        'Intrinsically exact intrinsic viscosity (IV) cannot be determined visually',
        'Presence of barrier coating or UV blockers unconfirmed without spectroscopy',
        'Batch weight requires physical weighment on calibrated scale',
      ],
      recommended_preparation: [
        'Unscrew and segregate colored caps to earn clean flake premium',
        'Perforate and flatten bottle bodies to reduce shipping transport footprint',
        'Ensure bottles are completely drained of sugary syrup or beverage liquid',
      ],
      visual_explanation: 'Simulated profile for clear PET beverage bottles with high polymer clarity and 88% net recoverability index.',
      model_name: FALLBACK_ENGINE_LABEL,
      is_fallback_inference: true,
    };
  }
}

export const fallbackService = new FallbackService();

