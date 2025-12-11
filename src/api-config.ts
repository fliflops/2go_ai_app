import 'dotenv';

export const OCI_CONFIG = {
    agentEndpointId: process.env.AGENT_ENDPOINT_ID as string,// Your agent endpoint OCID
    compartmentId: process.env.COMPARTMENT_ID as string,// Your compartment OCID 
    configFilePath: process.env.CONFIG_FILEPATH as string, // Path to OCI config file
    configProfile: process.env.CONFIG_PROFILE as string// Profile name in config file
}