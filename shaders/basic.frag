#version 410 core

in vec3 fPosition;
in vec3 fNormal;
in vec2 fTexCoords;

out vec4 fColor;

//matrices
uniform mat4 model;
uniform mat4 view;
uniform mat3 normalMatrix;

//lighting
uniform vec3 lightDir;
uniform vec3 lightColor;

uniform vec3 lightPunctiform;
uniform vec3 lightPunctiformColor;

// textures
uniform sampler2D diffuseTexture;
uniform sampler2D specularTexture;

uniform int afisLuminaPunct;

//components
vec3 ambient;
float ambientStrength = 0.2f;
vec3 diffuse;
vec3 specular;
float specularStrength = 0.5f;

float constant = 1.0f;
float linear = 0.045f;
float quadratic = 0.0075f;

vec4 fPosEye;

void computeDirLight()
{
    //compute eye space coordinates
    fPosEye = view * model * vec4(fPosition, 1.0f);
    vec3 normalEye = normalize(normalMatrix * fNormal);

    //normalize light direction
    vec3 lightDirN = vec3(normalize(view * vec4(lightDir, 0.0f)));

    //compute view direction (in eye coordinates, the viewer is situated at the origin
    vec3 viewDir = normalize(-fPosEye.xyz);

    //compute ambient light
    ambient = ambientStrength * lightColor;

    //compute diffuse light
    diffuse = max(dot(normalEye, lightDirN), 0.0f) * lightColor;

    //compute specular light
    vec3 reflectDir = reflect(-lightDirN, normalEye);
    float specCoeff = pow(max(dot(viewDir, reflectDir), 0.0f), 32.0f);
    specular = specularStrength * specCoeff * lightColor;
}

vec3 computePunctiformLight(vec3 diffTex, vec3 specTex) 
 {
    fPosEye = vec4(fPosition, 1.0f);

    //compute distance to light
	float dist = length(lightPunctiform - fPosEye.xyz);
	//compute attenuation
	float att = 1.0f / (constant + linear * dist + quadratic * (dist * dist));

    //transform normal
	vec3 normalEye = normalize(fNormal);
    //compute light direction
	vec3 lightDirN = normalize(lightPunctiform - fPosEye.xyz);
    //compute view direction 
	vec3 viewDirN = normalize(lightPunctiform- fPosEye.xyz);

    //compute ambient light
	vec3 ambient1 = att  *ambientStrength * lightPunctiformColor;
    //compute diffuse light
	vec3 diffuse1 = att * max(dot(normalEye, lightDirN), 0.0f) * lightPunctiformColor;

    vec3 halfVector = normalize(lightDirN + viewDirN);
	float specCoeff = pow(max(dot(viewDirN, halfVector), 0.3f), 32.0f);
	vec3 specular1 = att * specularStrength * specCoeff * lightPunctiformColor;


	
	return  min(((ambient + diffuse) * diffTex + specular * specTex ) * att * 2, 1.0f);


}


float computeFog()
{
 fPosEye = view * model * vec4(fPosition, 1.0f);
 float fogDensity = 0.007f;
 float fragmentDistance = length(fPosEye);
 float fogFactor = exp(-pow(fragmentDistance * fogDensity, 2));

 return clamp(fogFactor, 0.0f, 1.0f);
}

void main() 
{
    vec3 texColorDiffuse = texture(diffuseTexture, fTexCoords).rgb;
    vec3 texColorSpecular = texture(specularTexture, fTexCoords).rgb;

    computeDirLight();
    ambient *= texColorDiffuse;
    diffuse *= texColorDiffuse;
    specular *= texColorSpecular;

    vec3 color = ambient + diffuse + specular;

    if (afisLuminaPunct == 1) {
        vec3 punctLight = computePunctiformLight(texColorDiffuse, texColorSpecular);
        color = color + punctLight;
    }

    
    color = min(color, 1.0f);

    
    fColor = vec4(color, 1.0f);

}