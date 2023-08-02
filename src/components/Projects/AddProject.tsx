/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Button,
  FormControl,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  useToast,
  useDisclosure,
  ModalHeader,
  Tooltip,
  FormErrorMessage,
  FormLabel,
} from "@chakra-ui/react";
import { useEffect, useState, useContext } from "react";
import moment from "moment";
import { useForm, Controller } from "react-hook-form";

import { collection, addDoc, updateDoc, getDoc, doc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../services/config-db";
import { CompanyDetail, MA, ProjectDetail } from "../../@types/Type";

import { AuthContext } from "../../context/AuthContext";
import { CompanyContext } from "../../context/CompanyContext";
import { QuestionIcon } from "@chakra-ui/icons";

import classes from "./AddProject.module.css";

interface Props {
  companyId: string;
  companyName: string;
}

const AddProject: React.FC<Props> = (props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm();
  const [duration, setDuration] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const toast = useToast();
  const Auth = useContext(AuthContext);
  const CompanyCtx = useContext(CompanyContext);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: any) => {
    setIsAdding(true);
    const currentDate = moment().format("YYYY-MM-DD");
    const currentDateTime = moment().format("YYYY-MM-DD HH:mm:ss");
    let status: "advance" | "expire" | "active" | "deleted" | "cancel" =
      "active";
    if (currentDate >= data.startMA) {
      if (currentDate < data.endMA) {
        status = "active";
      } else {
        status = "expire";
      }
    } else {
      status = "advance";
    }
    const latestMA: MA = {
      startMA: data.startMA,
      endMA: data.endMA,
      cost: data.cost,
      createdBy: { username: Auth.username, uid: Auth.uid },
      updateLogs: [
        {
          note: "สร้างโปรเจกต์ใหม่",
          timeStamp: currentDateTime,
          updatedBy: { username: Auth.username, uid: Auth.uid },
        },
      ],
      createdAt: currentDateTime,
      status: status,
    };
    const detail: ProjectDetail = {
      companyID: props.companyId,
      companyName: props.companyName,
      createdAt: currentDateTime,
      createdBy: { username: Auth.username, uid: Auth.uid },
      projectName: data.projectName,
      status: "enable",
      shortName: data.shortName,
      firebaseId: data.firebaseID
      // MAlogs: [latestMA]
    };
    const snExists = await checkShortName(data.shortName)
    // console.log(detail);
    if (!snExists) {

      const companyRef = doc(db, "Company", props.companyId);
      const company = await getDoc(companyRef);
      const companyDetail = company.data() as CompanyDetail;
      const projectRef = collection(db, "Project");
      const newProjectRef = await addDoc(projectRef, detail);
      // console.log(newProjectRef.id, "has been added!")
      const MAref = collection(doc(db, "Project", newProjectRef.id), "MAlogs");
      await addDoc(MAref, latestMA).then(() => {
        reset();
        onClose();
        toast({
          title: "เพิ่มโปรเจคสำเร็จ.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top",
        });
      });
      const project = {
        id: newProjectRef.id,
        projectName: data.projectName,
        status: "enable"
      };
      let updateProject = [];
      if (companyDetail.projects) {
        const allProject = companyDetail.projects;
        updateProject = [...allProject, project];
      } else {
        updateProject = [project];
      }
      await updateDoc(companyRef, { projects: updateProject });
    } else {
      toast({
        title: "ชื่อย่อโปรเจคต์มีอยู่แล้ว",
        description: "กรุณาเปลี่ยนชื่อย่อใหม่",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }

    setIsAdding(false);
  };

  const checkShortName = async (name: string) => {
    const projectRef = collection(db, "Project");
    const q = query(projectRef, where("shortName", "==", name));
    let isExists = true;
    await getDocs(q).then((p) => {
      if (p.size === 0) {
        isExists = false
      }
    })
    return isExists
  }

  useEffect(() => {
    if (props.companyName !== "") {
      setValue("companyName", props.companyName);
    } else {
      setValue("companyName", CompanyCtx.companyName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startMA = watch("startMA") || moment().format("YYYY-MM-DD");
  const endMA = watch("endMA") || moment().add(1, "year").format("YYYY-MM-DD");

  const durationData = (startDate: string, endDate: string) => {
    const a = new Date(startDate) as any;
    const b = new Date(endDate) as any;

    const d = Math.floor(b - a) / (1000 * 60 * 60 * 24);
    setDuration(d);
  };

  useEffect(() => {
    durationData(startMA, endMA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startMA, endMA]);
  return (
    <Box>
      <Button
        w="150px"
        borderRadius="16px"
        bg="#4C7BF4"
        color="#eee"
        _hover={{ opacity: "0.8" }}
        onClick={onOpen}
        fontWeight={"normal"}
      >
        เพิ่ม Project
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
        <ModalOverlay />
        <ModalContent w={{ base: "90%", sm: "90%", md: "30rem" }} p="1rem">
          <ModalCloseButton />
          <ModalHeader textAlign="center">เพิ่มโปรเจคต์</ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="companyName"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <FormControl mb="0.5rem">
                    <FormLabel fontWeight={"bold"}>บริษัท/ลูกค้า</FormLabel>
                    <Input type="text" {...field} readOnly />
                  </FormControl>
                )}
              />
              <Controller
                name="firebaseID"
                control={control}
                defaultValue={""}
                rules={{ required: { value: true, message: "กรุณากรอก firebase ID" } }}
                render={({ field }) => (
                  <FormControl isRequired mb="0.5rem" isInvalid={Boolean(errors["firebaseID"])}>
                    <FormLabel fontWeight={"bold"}>Firebase ID</FormLabel>
                    <Input className={classes.input} type="text" {...field} placeholder="firebase ID" />
                    <FormErrorMessage>
                      {errors["firebaseID"] && (errors["firebaseID"].message as string)}
                    </FormErrorMessage>
                  </FormControl>
                )}
              />
              <HStack>
                <Controller
                  name="projectName"
                  control={control}
                  defaultValue={""}
                  rules={{ required: { value: true, message: "กรุณากรอกชื่อโปรเจค" } }}
                  render={({ field }) => (
                    <FormControl isRequired mb="0.5rem" isInvalid={Boolean(errors["projectName"])}>
                      <FormLabel fontWeight={"bold"}>ชื่อโปรเจค</FormLabel>
                      <Input
                        className={classes.input} type="text" {...field} placeholder="project name" />
                      <FormErrorMessage>
                        {errors["projectName"] && (errors["projectName"].message as string)}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
                <Controller
                  name="shortName"
                  control={control}
                  defaultValue={""}
                  rules={{ required: { value: true, message: "กรุณาระบุชื่อย่อ" }, minLength: { value: 3, message: "ชื่อย่อต้องมี 3 ตัวอักษร" }, maxLength: { value: 3, message: "ชื่อย่อต้องมี 3 ตัวอักษร" } }}
                  render={({ field }) => (
                    <FormControl isRequired mb="0.5rem" isInvalid={Boolean(errors["shortName"])}>
                      <FormLabel fontWeight={"bold"}>ชื่อย่อ <Tooltip label="ชื่อย่อต้องมี 3 ตัวอักษรและเป็นตัวพิมพ์ใหญ่ภาษาอังกฤษเท่านั้น" placement="top" display="flex" alignItems={"center"} border={"1px"}><QuestionIcon /></Tooltip></FormLabel>
                      <Input
                        className={classes.input} type="text" {...field} placeholder="ABC" minHeight={3} maxLength={3} pattern="[A-Z]{3}" />
                      <FormErrorMessage>
                        {errors["shortName"] && (errors["shortName"].message as string)}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
              </HStack>

              <HStack>
                <Controller
                  name="startMA"
                  control={control}
                  defaultValue={moment().format("YYYY-MM-DD")}
                  rules={{ required: { value: true, message: "กรุณาระบุวันเริ่มสัญญา" } }}
                  render={({ field }) => (
                    <FormControl isRequired mb="0.5rem" isInvalid={Boolean(errors["startMA"])}>
                      <FormLabel fontWeight={"bold"}>start MA</FormLabel>
                      <Input
                        className={classes.input} type="date" {...field} />
                      <FormErrorMessage>
                        {errors["startMA"] && (errors["startMA"].message as string)}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
                <Controller
                  name="endMA"
                  control={control}
                  defaultValue={moment().add(1, "year").format("YYYY-MM-DD")}
                  rules={{ required: { value: true, message: "กรุณาระบุวันสิ้นสุดสัญญา" } }}
                  render={({ field }) => (
                    <FormControl isRequired mb="0.5rem" isInvalid={Boolean(errors["endMA"])}>
                      <FormLabel fontWeight={"bold"}>end MA</FormLabel>
                      <Input
                        className={classes.input} type="date" {...field} />
                      <FormErrorMessage>
                        {errors["endMA"] && (errors["endMA"].message as string)}
                      </FormErrorMessage>
                    </FormControl>
                  )}
                />
              </HStack>
              <Text mb="0.5rem">
                ระยะเวลา ={" "}
                <Text as="span" fontWeight={"bold"}>
                  {duration}
                </Text>{" "}
                วัน
              </Text>
              {duration < 1 && <Text color="red">ระยะเวลาอย่างน้อย 1 วัน</Text>}
              <Controller
                name="cost"
                control={control}
                defaultValue={""}
                rules={{ required: { value: true, message: "กรุณากรอกค่าบริการ" }, min: { value: 0, message: "ค่าบริการต้องมากกว่า 0" } }}
                render={({ field }) => (
                  <FormControl isRequired isInvalid={Boolean(errors["cost"])}>
                    <FormLabel fontWeight={"bold"}>ค่าบริการ</FormLabel>
                    <Input
                      className={classes.input}
                      type="number"
                      min={0}
                      {...field}
                      placeholder="0.00"
                    />
                    <FormErrorMessage>
                      {errors["cost"] && (errors["cost"].message as string)}
                    </FormErrorMessage>
                  </FormControl>
                )}
              />
              <HStack justify="center" mt="5">
                <Button
                  mr="68px"
                  onClick={() => {
                    onClose();
                  }}
                  colorScheme="gray"
                >
                  ปิด
                </Button>
                <Button
                  type="submit"
                  color="#fff"
                  bg="#4C7BF4"
                  _hover={{ opacity: "0.8" }}
                  isLoading={isAdding}
                  isDisabled={duration < 1}
                >
                  เพิ่ม
                </Button>
              </HStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AddProject;
