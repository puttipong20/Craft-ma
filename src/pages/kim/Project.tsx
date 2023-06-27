import {
    Box,
    Heading,
    Flex,
} from '@chakra-ui/react'

import AppSidebar from '../../components/kim/AppSidebar';

import classes from "./Project.module.css"

interface Props {
    children?: React.ReactNode
}

const Project: React.FC<Props> = (props) => {
    return (
        <Flex h="100vh">
            <Box h="100%" overflow={"auto"} className={classes.sidebar} px="5px" w="15%"  mr="15px" boxShadow={"5px 5px 5px rgba(0,0,0,0.1)"} >
                <Heading fontFamily={"inherit"}>
                    <AppSidebar />
                </Heading>
            </Box>
            <Box w="calc(100% - 15%)" p="1rem" >
                {props.children}
                {/* <ProjectPreviewComp /> */}
            </Box>
        </Flex>
    )
}

export default Project