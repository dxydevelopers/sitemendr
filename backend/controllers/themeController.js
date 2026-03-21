'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get theme settings for a subscription
const getThemeSettings = async (req, res) => {
  try {
    const { subscriptionId } = req.query;

    if (!subscriptionId) {
      return res.status(400).json({ success: false, error: 'subscriptionId is required' });
    }

    let theme = await prisma.themeSettings.findUnique({
      where: { subscriptionId }
    });

    // Create default theme if not exists
    if (!theme) {
      theme = await prisma.themeSettings.create({
        data: { subscriptionId }
      });
    }

    res.json({ success: true, data: theme });
  } catch (error) {
    console.error('Error fetching theme settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update theme settings
const updateThemeSettings = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      headingFont,
      bodyFont,
      borderRadius,
      containerWidth,
      buttonStyle,
      buttonSize,
      customCss
    } = req.body;

    const theme = await prisma.themeSettings.upsert({
      where: { subscriptionId },
      update: {
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
        ...(accentColor && { accentColor }),
        ...(backgroundColor && { backgroundColor }),
        ...(textColor && { textColor }),
        ...(headingFont && { headingFont }),
        ...(bodyFont && { bodyFont }),
        ...(borderRadius && { borderRadius }),
        ...(containerWidth && { containerWidth }),
        ...(buttonStyle && { buttonStyle }),
        ...(buttonSize && { buttonSize }),
        ...(customCss !== undefined && { customCss })
      },
      create: {
        subscriptionId,
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1E293B",
        accentColor: accentColor || "#10B981",
        backgroundColor: backgroundColor || "#FFFFFF",
        textColor: textColor || "#1F2937",
        headingFont: headingFont || "Inter",
        bodyFont: bodyFont || "Inter",
        borderRadius: borderRadius || "8px",
        containerWidth: containerWidth || "1280px",
        buttonStyle: buttonStyle || "rounded",
        buttonSize: buttonSize || "medium",
        customCss: customCss || null
      }
    });

    res.json({ success: true, data: theme });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Preview theme (just returns what would be saved, without saving)
const previewTheme = async (req, res) => {
  try {
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      headingFont,
      bodyFont,
      borderRadius,
      containerWidth,
      buttonStyle,
      buttonSize,
      customCss
    } = req.body;

    // Return the preview data
    res.json({
      success: true,
      data: {
        primaryColor: primaryColor || "#3B82F6",
        secondaryColor: secondaryColor || "#1E293B",
        accentColor: accentColor || "#10B981",
        backgroundColor: backgroundColor || "#FFFFFF",
        textColor: textColor || "#1F2937",
        headingFont: headingFont || "Inter",
        bodyFont: bodyFont || "Inter",
        borderRadius: borderRadius || "8px",
        containerWidth: containerWidth || "1280px",
        buttonStyle: buttonStyle || "rounded",
        buttonSize: buttonSize || "medium",
        customCss: customCss || null
      }
    });
  } catch (error) {
    console.error('Error previewing theme:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reset to default theme
const resetTheme = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const theme = await prisma.themeSettings.update({
      where: { subscriptionId },
      data: {
        primaryColor: "#3B82F6",
        secondaryColor: "#1E293B",
        accentColor: "#10B981",
        backgroundColor: "#FFFFFF",
        textColor: "#1F2937",
        headingFont: "Inter",
        bodyFont: "Inter",
        borderRadius: "8px",
        containerWidth: "1280px",
        buttonStyle: "rounded",
        buttonSize: "medium",
        customCss: null
      }
    });

    res.json({ success: true, data: theme });
  } catch (error) {
    console.error('Error resetting theme:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Generate CSS variables from theme
const generateThemeCSS = async (theme) => {
  return `
    :root {
      --color-primary: ${theme.primaryColor};
      --color-secondary: ${theme.secondaryColor};
      --color-accent: ${theme.accentColor};
      --color-background: ${theme.backgroundColor};
      --color-text: ${theme.textColor};
      
      --font-heading: '${theme.headingFont}', sans-serif;
      --font-body: '${theme.bodyFont}', sans-serif;
      
      --radius: ${theme.borderRadius};
      --container-width: ${theme.containerWidth};
      
      --button-radius: ${theme.buttonStyle === 'pill' ? '9999px' : theme.buttonStyle === 'rounded' ? '8px' : '0'};
      --button-padding: ${theme.buttonSize === 'small' ? '8px 16px' : theme.buttonSize === 'large' ? '16px 32px' : '12px 24px'};
    }
    
    ${theme.customCss || ''}
  `;
};

module.exports = {
  getThemeSettings,
  updateThemeSettings,
  previewTheme,
  resetTheme,
  generateThemeCSS
};
