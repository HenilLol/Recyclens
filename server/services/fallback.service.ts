import { RecoveryProfile } from '../../src/types/recyclens.types.ts';

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
      return {
        primary_material: {
          code: 'PAPER_CARDBOARD',
          name: 'Corrugated Cardboard (OCC Kraft Packaging)',
          category: 'PAPER',
          confidence: 88.0,
          polymer_subtype: 'Cellulose Kraft Linerboard',
        },
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
      return {
        primary_material: {
          code: 'METAL_ALUMINIUM',
          name: 'Aluminium UBC Beverage Cans (Standard Wrought UBC Archetype)',
          category: 'METAL',
          confidence: 94.0,
          polymer_subtype: 'Wrought Aluminium UBC',
        },
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
      return {
        primary_material: {
          code: 'EWASTE_PCB',
          name: 'Populated Printed Circuit Boards (FR4 Grade)',
          category: 'EWASTE',
          confidence: 92.0,
          polymer_subtype: 'FR4 Epoxy-Glass + Cu/Au Metallurgy',
        },
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
      return {
        primary_material: {
          code: 'PLASTIC_HDPE',
          name: 'High-Density Polyethylene (HDPE Blow Molded)',
          category: 'PLASTIC',
          confidence: 90.0,
          polymer_subtype: 'HDPE Rigid (Type 2)',
        },
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
    return {
      primary_material: {
        code: 'PLASTIC_PET',
        name: 'Polyethylene Terephthalate (PET Bottles)',
        category: 'PLASTIC',
        confidence: 90.0,
        polymer_subtype: 'PET Rigid Bottle Grade (Type 1)',
      },
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

