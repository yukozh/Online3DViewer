import { RGBColor, RGBColorToHexString, RGBAColor, RGBAColorToHexString, ColorComponentFromFloat } from '../engine/model/color.js';
import { AddDiv, AddDomElement, ShowDomElement, SetDomElementOuterHeight } from '../engine/viewer/domutils.js';
import { AddRangeSlider, AddToggle, AddCheckbox } from '../website/utils.js';
import { CalculatePopupPositionToElementTopLeft } from './dialogs.js';
import { PopupDialog } from './dialog.js';
import { Settings, Theme } from './settings.js';
import { SidebarPanel } from './sidebarpanel.js';
import { ShadingType } from '../engine/threejs/threeutils.js';

function AddColorPicker (parentDiv, opacity, defaultColor, predefinedColors, onChange)
{
    let pickr = Pickr.create ({
        el : parentDiv,
        theme : 'monolith',
        position : 'left-start',
        swatches : predefinedColors,
        comparison : false,
        default : defaultColor,
        components : {
            preview : false,
            opacity : opacity,
            hue : true,
            interaction: {
                hex : false,
                rgba : false,
                hsla : false,
                hsva : false,
                cmyk : false,
                input : true,
                clear : false,
                save : false
            }
        }
    });
    pickr.on ('change', (color, source, instance) => {
        let rgbaColor = color.toRGBA ();
        onChange (
            parseInt (rgbaColor[0], 10),
            parseInt (rgbaColor[1], 10),
            parseInt (rgbaColor[2], 10),
            ColorComponentFromFloat (rgbaColor[3])
        );
    });
    return pickr;
}

class EnvironmentMapPopup extends PopupDialog
{
    constructor ()
    {
        super ();
    }

    ShowPopup (buttonDiv, shadingType, settings, callbacks)
    {
        let contentDiv = super.Init (() => {
            return CalculatePopupPositionToElementTopLeft (buttonDiv, contentDiv);
        });

        let envMapImages = [
            {
                element: null,
                name: 'fishermans_bastion'
            },
            {
                element: null,
                name: 'citadella'
            },
            {
                element: null,
                name: 'maskonaive'
            },
            {
                element: null,
                name: 'teide'
            },
            {
                element: null,
                name: 'ice_river'
            },
            {
                element: null,
                name: 'park'
            }
        ];

        if (shadingType === ShadingType.Phong) {
            envMapImages.unshift ({
                element : null,
                name : 'noimage'
            });
            for (let envMapImage of envMapImages) {
                envMapImage.element = AddDomElement (contentDiv, 'img', 'ov_environment_map_preview');
                envMapImage.element.setAttribute ('src', 'assets/envmaps/' + envMapImage.name + '.jpg');
                let isSelected = false;
                if (settings.backgroundIsEnvMap) {
                    isSelected = (envMapImage.name === settings.environmentMapName);
                } else {
                    isSelected = (envMapImage.name === 'noimage');
                }
                if (isSelected) {
                    envMapImage.element.classList.add ('selected');
                }
                envMapImage.element.addEventListener ('click', () => {
                    for (let otherImage of envMapImages) {
                        otherImage.element.classList.remove ('selected');
                    }
                    envMapImage.element.classList.add ('selected');
                    if (envMapImage.name === 'noimage') {
                        settings.backgroundIsEnvMap = false;
                        settings.environmentMapName = 'fishermans_bastion';
                    } else {
                        settings.backgroundIsEnvMap = true;
                        settings.environmentMapName = envMapImage.name;
                    }
                    callbacks.onEnvironmentMapChange ();
                });
            }
        } else if (shadingType === ShadingType.Physical) {
            let checkboxDiv = AddDiv (contentDiv, 'ov_environment_map_checkbox');
            let backgroundIsEnvMapCheckbox = AddCheckbox (checkboxDiv, 'use_as_background', 'Use as background image', settings.backgroundIsEnvMap, () => {
                settings.backgroundIsEnvMap = backgroundIsEnvMapCheckbox.checked;
                callbacks.onEnvironmentMapChange ();
            });

            for (let envMapImage of envMapImages) {
                envMapImage.element = AddDomElement (contentDiv, 'img', 'ov_environment_map_preview');
                envMapImage.element.setAttribute ('src', 'assets/envmaps/' + envMapImage.name + '.jpg');
                if (envMapImage.name === settings.environmentMapName) {
                    envMapImage.element.classList.add ('selected');
                }
                envMapImage.element.addEventListener ('click', () => {
                    for (let otherImage of envMapImages) {
                        otherImage.element.classList.remove ('selected');
                    }
                    envMapImage.element.classList.add ('selected');
                    settings.environmentMapName = envMapImage.name;
                    callbacks.onEnvironmentMapChange ();
                });
            }
        }

        contentDiv.classList.add ('sidebar');
        this.Open ();
    }
}

class SettingsSection
{
    constructor (parentDiv, title)
    {
        this.parentDiv = parentDiv;
        this.contentDiv = AddDiv (this.parentDiv, 'ov_sidebar_settings_section');
        AddDiv (this.contentDiv, 'ov_sidebar_title', title);
    }

    Init (settings, callbacks)
    {

    }

    Update (settings)
    {

    }

    Clear ()
    {

    }
}

class SettingsModelDisplaySection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, '模型展示');

        this.backgroundColorPicker = null;

        this.environmentMapPhongDiv = null;
        this.environmentMapPhongInput = null;

        this.environmentMapPbrDiv = null;
        this.environmentMapPbrInput = null;

        this.environmentMapPopup = null;

        this.edgeDisplayToggle = null;
        this.edgeColorPicker = null;
        this.thresholdSlider = null;
        this.thresholdSliderValue = null;
        this.edgeSettingsDiv = null;
    }

    Init (settings, callbacks)
    {
        let backgroundColorDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        let backgroundColorInput = AddDiv (backgroundColorDiv, 'ov_color_picker');
        AddDiv (backgroundColorDiv, null, '背景色');
        let predefinedBackgroundColors = ['#ffffffff', '#e3e3e3ff', '#c9c9c9ff', '#898989ff', '#5f5f5fff', '#494949ff', '#383838ff', '#0f0f0fff'];
        let defaultBackgroundColor = '#' + RGBAColorToHexString (settings.backgroundColor);
        this.backgroundColorPicker = AddColorPicker (backgroundColorInput, true, defaultBackgroundColor, predefinedBackgroundColors, (r, g, b, a) => {
            settings.backgroundColor = new RGBAColor (r, g, b, a);
            callbacks.onBackgroundColorChange ();
        });

        this.environmentMapPhongDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.environmentMapPhongInput = AddDiv (this.environmentMapPhongDiv, 'ov_sidebar_image_picker');
        AddDiv (this.environmentMapPhongDiv, null, '背景图');
        this.environmentMapPhongInput.addEventListener ('click', () => {
            this.environmentMapPopup = new EnvironmentMapPopup ();
            this.environmentMapPopup.ShowPopup (this.environmentMapPhongInput, ShadingType.Phong, settings, {
                onEnvironmentMapChange : () => {
                    this.UpdateEnvironmentMap (settings);
                    callbacks.onEnvironmentMapChange ();
                }
            });
        });

        this.environmentMapPbrDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.environmentMapPbrInput = AddDiv (this.environmentMapPbrDiv, 'ov_sidebar_image_picker');
        AddDiv (this.environmentMapPbrDiv, null, 'Environment');
        this.environmentMapPbrInput.addEventListener ('click', () => {
            this.environmentMapPopup = new EnvironmentMapPopup ();
            this.environmentMapPopup.ShowPopup (this.environmentMapPbrInput, ShadingType.Physical, settings, {
                onEnvironmentMapChange : () => {
                    this.UpdateEnvironmentMap (settings);
                    callbacks.onEnvironmentMapChange ();
                }
            });
        });

        this.UpdateEnvironmentMap (settings);

        let edgeParameterDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        this.edgeDisplayToggle = AddToggle (edgeParameterDiv, 'ov_sidebar_parameter_toggle');
        AddDiv (edgeParameterDiv, 'ov_sidebar_parameter_text', '显示边');

        this.edgeSettingsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_padded');
        this.edgeDisplayToggle.OnChange (() => {
            ShowDomElement (this.edgeSettingsDiv, this.edgeDisplayToggle.GetStatus ());
            settings.showEdges = this.edgeDisplayToggle.GetStatus ();
            callbacks.onShowEdgesChange ();
        });

        let edgeColorRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row');
        let predefinedEdgeColors = ['#ffffff', '#e3e3e3', '#c9c9c9', '#898989', '#5f5f5f', '#494949', '#383838', '#0f0f0f'];

        let edgeColorInput = AddDiv (edgeColorRow, 'ov_color_picker');
        let defaultEdgeColor = '#' + RGBColorToHexString (settings.edgeColor);
        this.edgeColorPicker = AddColorPicker (edgeColorInput, false, defaultEdgeColor, predefinedEdgeColors, (r, g, b, a) => {
            settings.edgeColor = new RGBColor (r, g, b);
            callbacks.onEdgeColorChange ();
        });
        AddDiv (edgeColorRow, null, '边的颜色');

        let thresholdRow = AddDiv (this.edgeSettingsDiv, 'ov_sidebar_settings_row large');
        this.thresholdSlider = AddRangeSlider (thresholdRow, 0, 90);
        this.thresholdSlider.setAttribute ('title', '边角阈值');
        this.thresholdSliderValue = AddDomElement (thresholdRow, 'span', 'ov_slider_label');
        this.thresholdSlider.addEventListener ('input', () => {
            this.thresholdSliderValue.innerHTML = this.thresholdSlider.value;
        });
        this. thresholdSlider.addEventListener ('change', () => {
            settings.edgeThreshold = this.thresholdSlider.value;
            callbacks.onEdgeThresholdChange ();
        });
        this.thresholdSlider.value = settings.edgeThreshold;
        this.thresholdSliderValue.innerHTML = settings.edgeThreshold;

        this.edgeDisplayToggle.SetStatus (settings.showEdges);
        ShowDomElement (this.edgeSettingsDiv, settings.showEdges);
    }

    UpdateVisibility (isPhysicallyBased)
    {
        if (this.environmentMapPhongDiv !== null) {
           ShowDomElement (this.environmentMapPhongDiv, !isPhysicallyBased);
        }
        if (this.environmentMapPbrDiv !== null) {
           ShowDomElement (this.environmentMapPbrDiv, isPhysicallyBased);
        }
    }

    UpdateEnvironmentMap (settings)
    {
        function UpdateImage (input, image)
        {
            input.style.backgroundImage = 'url(\'assets/envmaps/' + image + '.jpg\')';
        }

        if (this.environmentMapPhongDiv !== null) {
            if (settings.backgroundIsEnvMap) {
                UpdateImage (this.environmentMapPhongInput, settings.environmentMapName);
                this.environmentMapPhongInput.classList.remove ('ov_environment_map_preview_no_color');
            } else {
                this.environmentMapPhongInput.style.backgroundImage = null;
                this.environmentMapPhongInput.classList.add ('ov_environment_map_preview_no_color');
            }
        }
        if (this.environmentMapPbrDiv !== null) {
            UpdateImage (this.environmentMapPbrInput, settings.environmentMapName);
        }
    }

    Update (settings)
    {
        if (this.backgroundColorPicker !== null) {
            this.backgroundColorPicker.setColor ('#' + RGBAColorToHexString (settings.backgroundColor));
        }

        if (this.environmentMapPbrInput !== null || this.environmentMapPhongDiv !== null) {
            this.UpdateEnvironmentMap (settings);
        }

        if (this.edgeDisplayToggle !== null) {
            this.edgeDisplayToggle.SetStatus (settings.showEdges);
            ShowDomElement (this.edgeSettingsDiv, settings.showEdges);

            this.edgeColorPicker.setColor ('#' + RGBColorToHexString (settings.edgeColor));
            this.thresholdSlider.value = settings.edgeThreshold;
            this.thresholdSliderValue.innerHTML = settings.edgeThreshold;
        }
    }

    Clear ()
    {
        if (this.environmentMapPopup !== null) {
            this.environmentMapPopup.Close ();
            this.environmentMapPopup = null;
        }

        if (this.backgroundColorPicker !== null) {
            this.backgroundColorPicker.hide ();
        }

        if (this.edgeColorPicker !== null) {
            this.edgeColorPicker.hide ();
        }
    }
}

class SettingsImportParametersSection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, '导入设置');
        this.defaultColorPicker = null;
    }

    Init (settings, callbacks)
    {
        let defaultColorDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');
        let defaultColorInput = AddDiv (defaultColorDiv, 'ov_color_picker');
        AddDiv (defaultColorDiv, null, 'Default Color');
        let predefinedDefaultColors = ['#ffffff', '#e3e3e3', '#cc3333', '#fac832', '#4caf50', '#3393bd', '#9b27b0', '#fda4b8'];
        let defaultColor = '#' + RGBColorToHexString (settings.defaultColor);
        this.defaultColorPicker = AddColorPicker (defaultColorInput, false, defaultColor, predefinedDefaultColors, (r, g, b, a) => {
            settings.defaultColor = new RGBColor (r, g, b);
            callbacks.onDefaultColorChange ();
        });
    }

    Update (settings)
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.setColor ('#' + RGBColorToHexString (settings.defaultColor));
        }
    }

    UpdateVisibility (hasDefaultMaterial)
    {
        if (this.contentDiv !== null) {
            ShowDomElement (this.contentDiv, hasDefaultMaterial);
        }
    }

    Clear ()
    {
        if (this.defaultColorPicker !== null) {
            this.defaultColorPicker.hide ();
        }
    }
}

class SettingsAppearanceSection extends SettingsSection
{
    constructor (parentDiv)
    {
        super (parentDiv, '界面');
        this.darkModeToggle = null;
    }

    Init (settings, callbacks)
    {
        let darkModeParameterDiv = AddDiv (this.contentDiv, 'ov_sidebar_parameter');

        this.darkModeToggle = AddToggle (darkModeParameterDiv, 'ov_sidebar_parameter_toggle');
        this.darkModeToggle.OnChange (() => {
            settings.themeId = (this.darkModeToggle.GetStatus () ? Theme.Dark : Theme.Light);
            callbacks.onThemeChange ();
        });
        AddDiv (darkModeParameterDiv, null, '深色模式');

        let isDarkMode = (settings.themeId === Theme.Dark);
        this.darkModeToggle.SetStatus (isDarkMode);
    }

    Update (settings)
    {
        if (this.darkModeToggle !== null) {
            let isDarkMode = (settings.themeId === Theme.Dark);
            this.darkModeToggle.SetStatus (isDarkMode);
        }
    }
}

export class SidebarSettingsPanel extends SidebarPanel
{
    constructor (parentDiv, settings)
    {
        super (parentDiv);
        this.settings = settings;

        this.sectionsDiv = AddDiv (this.contentDiv, 'ov_sidebar_settings_sections ov_thin_scrollbar');
        this.modelDisplaySection = new SettingsModelDisplaySection (this.sectionsDiv);
        this.importParametersSection = new SettingsImportParametersSection (this.sectionsDiv);
        this.appearanceSection = new SettingsAppearanceSection (this.sectionsDiv);

        this.resetToDefaultsButton = AddDiv (this.contentDiv, 'ov_button ov_panel_button outline', '还原默认设置');
        this.resetToDefaultsButton.addEventListener ('click', () => {
            this.ResetToDefaults ();
        });
    }

    GetName ()
    {
        return '设置';
    }

    HasTitle ()
    {
        return false;
    }

    GetIcon ()
    {
        return 'settings';
    }

    Clear ()
    {
        this.modelDisplaySection.Clear ();
        this.importParametersSection.Clear ();
        this.appearanceSection.Clear ();
    }

    Init (callbacks)
    {
        super.Init (callbacks);
        this.modelDisplaySection.Init (this.settings, {
            onEnvironmentMapChange : () => {
                callbacks.onEnvironmentMapChange ();
            },
            onBackgroundColorChange : () => {
                callbacks.onBackgroundColorChange ();
            },
            onShowEdgesChange : () => {
                callbacks.onEdgeDisplayChange ();
            },
            onEdgeColorChange : () => {
                callbacks.onEdgeDisplayChange ();
            },
            onEdgeThresholdChange : () => {
                callbacks.onEdgeDisplayChange ();
            }
        });
        this.importParametersSection.Init (this.settings, {
            onDefaultColorChange : () => {
                callbacks.onDefaultColorChange ();
            }
        });
        this.appearanceSection.Init (this.settings, {
            onThemeChange : () => {
                if (this.settings.themeId === Theme.Light) {
                    this.settings.backgroundColor = new RGBAColor (255, 255, 255, 255);
                    this.settings.defaultColor = new RGBColor (200, 200, 200);
                } else if (this.settings.themeId === Theme.Dark) {
                    this.settings.backgroundColor = new RGBAColor (42, 43, 46, 255);
                    this.settings.defaultColor = new RGBColor (200, 200, 200);
                }
                this.modelDisplaySection.Update (this.settings);
                this.importParametersSection.Update (this.settings);
                callbacks.onThemeChange ();
            }
        });
    }

    UpdateSettings (isPhysicallyBased, hasDefaultMaterial)
    {
        this.modelDisplaySection.UpdateVisibility (isPhysicallyBased);
        this.importParametersSection.UpdateVisibility (hasDefaultMaterial);
        this.Resize ();
    }

    ResetToDefaults ()
    {
        let defaultSettings = new Settings ();

        this.settings.environmentMapName = defaultSettings.environmentMapName;
        this.settings.backgroundIsEnvMap = defaultSettings.backgroundIsEnvMap;
        this.settings.backgroundColor = defaultSettings.backgroundColor;
        this.settings.defaultColor = defaultSettings.defaultColor;
        this.settings.showEdges = defaultSettings.showEdges;
        this.settings.edgeColor = defaultSettings.edgeColor;
        this.settings.edgeThreshold = defaultSettings.edgeThreshold;
        this.settings.themeId = defaultSettings.themeId;

        this.modelDisplaySection.Update (this.settings);
        this.importParametersSection.Update (this.settings);
        this.appearanceSection.Update (this.settings);

        this.callbacks.onEnvironmentMapChange ();
        this.callbacks.onThemeChange ();
    }

    Resize ()
    {
        let resetButtonHeight = this.resetToDefaultsButton.offsetHeight;
        let height = this.parentDiv.offsetHeight;
        SetDomElementOuterHeight (this.sectionsDiv, height - resetButtonHeight);
    }
}
